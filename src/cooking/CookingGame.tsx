import { useProgress } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Component, Suspense, useCallback, useEffect, useReducer, useRef, useState, type ReactNode, type RefObject } from 'react';
import { CardGrid, CardProjector, FrameBoard, Table } from './Board';
import { Character, type WalkGoal } from './Character';
import { DishArt } from './dishArt';
import { IngredientArt, hasIngredientArt } from './ingredientArt';
import {
  ALL_INGREDIENT_IDS,
  RECIPES,
  ingredientById,
  recipeById,
  type Recipe,
} from './ingredients';
import { slotPosition } from './layout';
import { DuelCookingGame } from './DuelCookingGame';
import { MainMenu, MenuToggleButton } from './MainMenu';
import { dealCards, formatElapsed, revealPair, type Round } from './logic';
import { createMatchClient, type MatchStatus } from './matchClient';
import type { ClientMessage, RoomSnapshot, ServerMessage } from './matchProtocol';
import { useLandscapeGate } from './useLandscapeGate';
import './cooking.css';

type Phase = 'preview' | 'play' | 'won';

function randomRecipeId(except?: string) {
  const pool = except ? RECIPES.filter((item) => item.id !== except) : RECIPES;
  const source = pool.length > 0 ? pool : RECIPES;
  return source[Math.floor(Math.random() * source.length)]!.id;
}

function openingRecipe() {
  const requested = new URLSearchParams(window.location.search).get('dish');
  if (requested && RECIPES.some((item) => item.id === requested)) return requested;
  return randomRecipeId();
}
type Motion = 'idle' | 'walk' | 'point';

interface LastPick {
  ingredientId: string;
  turn: number;
}

interface FlyChip {
  id: number;
  emoji: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface GameState {
  roundId: number;
  recipeId: string;
  cards: string[];
  found: string[];
  mistakes: number;
  removed: number[];
  revealed: number[];
  open: number[];
  matched: number[];
  phase: Phase;
  last: LastPick | null;
  turn: number;
}

type GameAction =
  | { type: 'start'; recipeId: string }
  | { type: 'begin-play' }
  | { type: 'revealed'; result: ReturnType<typeof revealPair>; index: number }
  | { type: 'collect' };

function createRound(recipeId: string, roundId: number): GameState {
  const recipe = recipeById(recipeId);
  return {
    roundId,
    recipeId: recipe.id,
    cards: dealCards(recipe.ingredientIds, ALL_INGREDIENT_IDS, Math.random),
    found: [],
    mistakes: 0,
    removed: [],
    revealed: [],
    open: [],
    matched: [],
    phase: 'preview',
    last: null,
    turn: 0,
  };
}

function toRound(state: GameState): Round {
  return {
    recipeIds: recipeById(state.recipeId).ingredientIds,
    cards: state.cards,
    found: state.found,
    mistakes: state.mistakes,
    removed: state.removed,
    open: state.open,
  };
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start':
      return createRound(action.recipeId, state.roundId + 1);
    case 'begin-play':
      if (state.phase !== 'preview') return state;
      return { ...state, phase: 'play' };
    case 'revealed': {
      if (state.phase !== 'play') return state;
      const { round, outcome } = action.result;
      if (outcome === 'ignore') return state;
      const ingredientId = state.cards[action.index] ?? '';
      if (outcome === 'match') {
        const turn = state.turn + 1;
        return {
          ...state,
          open: [],
          revealed: action.result.matched,
          matched: action.result.matched,
          found: round.found,
          mistakes: round.mistakes,
          phase: action.result.phase,
          turn,
          last: { ingredientId, turn },
        };
      }
      return {
        ...state,
        open: round.open,
        revealed: round.open,
        matched: [],
        mistakes: round.mistakes,
      };
    }
    case 'collect':
      if (state.matched.length === 0) return state;
      return {
        ...state,
        revealed: [],
        matched: [],
        removed: [...state.removed, ...state.matched],
      };
    default:
      return state;
  }
}

let audio: AudioContext | null = null;

function beep(freq: number, duration = 0.12, volume = 0.03, type: OscillatorType = 'sine') {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume();
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(volume, audio.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
    osc.connect(amp);
    amp.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duration);
  } catch {
    // Audio can stay blocked until the first click. The board still plays.
  }
}

class ModelBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function SignalFail({ onFail }: { onFail: () => void }) {
  useEffect(() => {
    onFail();
  }, [onFail]);
  return null;
}

function RotateGate({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="rotate-gate" role="dialog" aria-live="polite">
      <div>
        <strong>請橫放手機</strong>
        <p>記憶烹飪採橫向排版，轉成橫向後即可開始</p>
      </div>
    </div>
  );
}

export function CookingGame() {
  const needsRotate = useLandscapeGate();
  const [state, dispatch] = useReducer(reducer, undefined, () => createRound(openingRecipe(), 1));
  const [seconds, setSeconds] = useState(10);
  const [elapsed, setElapsed] = useState(0);
  const [motion, setMotion] = useState<Motion>('idle');
  const [goal, setGoal] = useState<WalkGoal | null>(null);
  const [busy, setBusy] = useState(false);
  const [chefReady, setChefReady] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);
  const [go, setGo] = useState(false);
  const [flies, setFlies] = useState<FlyChip[]>([]);
  const [dishPop, setDishPop] = useState(false);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('idle');
  const [matchError, setMatchError] = useState<string | null>(null);
  const [duel, setDuel] = useState<{ seat: 0 | 1; room: RoomSnapshot } | null>(null);
  const [inGame, setInGame] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const timers = useRef<number[]>([]);
  const pointDuration = useRef(2.43);
  const goalRef = useRef<WalkGoal | null>(null);
  const stateRef = useRef(state);
  const projectRef = useRef<((index: number) => { x: number; y: number }) | null>(null);
  const potRef = useRef<HTMLDivElement>(null);
  const flySerial = useRef(0);
  const heard = useRef(0);
  const previewLeft = useRef(10);
  const elapsedRef = useRef(0);
  const matchRef = useRef<ReturnType<typeof createMatchClient> | null>(null);
  const duelListeners = useRef(new Set<(message: ServerMessage) => void>());
  goalRef.current = goal;
  stateRef.current = state;
  elapsedRef.current = elapsed;

  useEffect(() => () => {
    matchRef.current?.close();
  }, []);

  const ensureMatchClient = () => {
    if (matchRef.current) return matchRef.current;
    matchRef.current = createMatchClient({
      onStatus: (status, error = null) => {
        setMatchStatus(status);
        setMatchError(error ?? null);
      },
      onMessage: (message) => {
        if (message.type === 'matched') {
          setDuel({ seat: message.seat, room: message.room });
        }
        for (const listener of duelListeners.current) listener(message);
      },
    });
    return matchRef.current;
  };

  const startMatchmaking = () => {
    ensureMatchClient().connectAndQueue();
  };

  const cancelMatchmaking = () => {
    matchRef.current?.cancel();
    setMatchStatus('idle');
    setMatchError(null);
    if (!inGame) setMenuOpen(true);
  };

  const leaveDuel = () => {
    matchRef.current?.close();
    matchRef.current = null;
    setDuel(null);
    setMatchStatus('idle');
    setMatchError(null);
    setInGame(false);
    setMenuOpen(true);
  };

  const returnToTitle = () => {
    clearTimers();
    setBusy(false);
    setMotion('idle');
    setGoal(null);
    setGo(false);
    setFlies([]);
    setDishPop(false);
    setInGame(false);
    setMenuOpen(true);
    dispatch({ type: 'start', recipeId: openingRecipe() });
  };

  const sendDuel = (message: ClientMessage) => {
    matchRef.current?.send(message);
  };

  const listenDuel = useCallback((handler: (message: ServerMessage) => void) => {
    duelListeners.current.add(handler);
    return () => {
      duelListeners.current.delete(handler);
    };
  }, []);

  const recipe = recipeById(state.recipeId);
  const nextDishId = useRef<string | null>(null);
  if (state.phase === 'won') {
    if (!nextDishId.current) nextDishId.current = randomRecipeId(state.recipeId);
  } else if (nextDishId.current) {
    nextDishId.current = null;
  }
  const nextRecipe = nextDishId.current ? recipeById(nextDishId.current) : null;
  const { active, progress } = useProgress();

  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  };

  useEffect(() => {
    return () => {
      for (const id of timers.current) window.clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (state.phase === 'preview') {
      previewLeft.current = 10;
      setSeconds(10);
    }
  }, [state.phase, state.roundId]);

  useEffect(() => {
    if (!inGame || !chefReady || state.phase !== 'preview' || menuOpen) return undefined;
    setSeconds(previewLeft.current);
    const id = window.setInterval(() => {
      previewLeft.current -= 1;
      setSeconds(Math.max(previewLeft.current, 0));
      if (previewLeft.current <= 0) {
        window.clearInterval(id);
        dispatch({ type: 'begin-play' });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [inGame, chefReady, state.phase, state.roundId, menuOpen]);

  useEffect(() => {
    if (!inGame || state.phase === 'preview') {
      setElapsed(0);
      return undefined;
    }
    if (state.phase !== 'play' || menuOpen) return undefined;
    const started = performance.now() - elapsedRef.current * 1000;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((performance.now() - started) / 1000));
    }, 200);
    return () => window.clearInterval(id);
  }, [inGame, state.phase, state.roundId, menuOpen]);

  useEffect(() => {
    if (duel) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Escape') return;
      event.preventDefault();
      if (matchStatus === 'connecting' || matchStatus === 'queued' || matchStatus === 'error') {
        cancelMatchmaking();
        return;
      }
      if (!inGame) return;
      if (dishPop) {
        setDishPop(false);
        return;
      }
      setMenuOpen((open) => !open);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [matchStatus, duel, dishPop, inGame]);

  useEffect(() => {
    if (!inGame || state.phase !== 'play') return undefined;
    setGo(true);
    const id = window.setTimeout(() => setGo(false), 900);
    return () => window.clearTimeout(id);
  }, [inGame, state.phase, state.roundId]);

  useEffect(() => {
    if (state.turn <= heard.current) {
      heard.current = state.turn;
      return;
    }
    heard.current = state.turn;
    if (!state.last) return;
    beep(523, 0.07, 0.03);
    window.setTimeout(() => beep(784, 0.1, 0.03), 90);
  }, [state.turn, state.last]);

  useEffect(() => {
    if (!inGame || state.phase !== 'won') {
      setDishPop(false);
      return undefined;
    }
    const id = window.setTimeout(() => setDishPop(true), 1200);
    return () => window.clearTimeout(id);
  }, [inGame, state.phase, state.roundId]);

  const onModelFail = useCallback(() => {
    setModelFailed(true);
    setChefReady(true);
  }, []);

  const flyPair = (partner: number, index: number, ingredientId: string) => {
    const project = projectRef.current;
    const pot = potRef.current?.getBoundingClientRect();
    if (!project || !pot) return;
    const toX = pot.left + pot.width * 0.46;
    const toY = pot.top + pot.height * 0.58;
    const emoji = ingredientById(ingredientId).emoji;
    const chips = [partner, index].map((slot) => {
      const from = project(slot);
      const id = flySerial.current;
      flySerial.current += 1;
      return { id, emoji, x: from.x, y: from.y, dx: toX - from.x, dy: toY - from.y };
    });
    setFlies((list) => [...list, ...chips]);
    window.setTimeout(() => {
      setFlies((list) => list.filter((chip) => !chips.some((item) => item.id === chip.id)));
    }, 760);
  };

  const motionToken = useRef(0);

  const finishMotion = () => {
    const token = motionToken.current;
    const duration = pointDuration.current || 2.43;
    const revealMs = Math.round(duration * 380);
    const remain = Math.max(280, Math.round(duration * 1000) - revealMs);
    timers.current.push(window.setTimeout(() => {
      if (motionToken.current !== token) return;
      setMotion('idle');
      setBusy(false);
    }, remain));
  };

  const revealNow = (index: number, instant = false) => {
    const result = revealPair(toRound(stateRef.current), index);
    if (result.outcome === 'ignore') {
      setBusy(false);
      setMotion('idle');
      return;
    }
    const ingredientId = stateRef.current.cards[index] ?? '';
    dispatch({ type: 'revealed', result, index });
    if (result.outcome === 'match') {
      const [partner, current] = result.matched;
      timers.current.push(window.setTimeout(() => {
        if (partner !== undefined && current !== undefined) flyPair(partner, current, ingredientId);
        dispatch({ type: 'collect' });
      }, 420));
    }
    if (instant) {
      setBusy(false);
      setMotion('idle');
      return;
    }
    finishMotion();
  };

  const start = (recipeId: string) => {
    clearTimers();
    setBusy(false);
    setMotion('idle');
    setGoal(null);
    setGo(false);
    setFlies([]);
    setDishPop(false);
    setInGame(true);
    setMenuOpen(false);
    dispatch({ type: 'start', recipeId });
  };

  const openMenu = () => {
    setDishPop(false);
    setMenuOpen(true);
  };
  const closeMenu = () => {
    if (!inGame) return;
    setMenuOpen(false);
  };

  const onPick = (index: number) => {
    if (!inGame || menuOpen || busy || state.phase !== 'play' || state.removed.includes(index) || state.revealed.includes(index)) return;
    if (modelFailed) {
      revealNow(index, true);
      return;
    }
    const spot = slotPosition(index);
    motionToken.current += 1;
    setBusy(true);
    setGoal({ index, x: spot.x, z: spot.z });
    setMotion('walk');
  };

  const onArrived = () => {
    const current = goalRef.current;
    if (!current) return;
    setMotion('point');
    const duration = pointDuration.current || 2.43;
    const revealMs = Math.round(duration * 380);
    timers.current.push(window.setTimeout(() => revealNow(current.index), revealMs));
  };

  const loadLabel = active ? `廚師準備中 ${Math.round(progress)}%` : '廚師準備中';

  if (duel) {
    return (
      <>
        <RotateGate show={needsRotate} />
        <DuelCookingGame
          seat={duel.seat}
          room={duel.room}
          send={sendDuel}
          onLeave={leaveDuel}
          onRoom={(room) => setDuel((current) => (current ? { ...current, room } : current))}
          listen={listenDuel}
        />
      </>
    );
  }

  return (
    <div className="cook">
      <RotateGate show={needsRotate} />
      {(matchStatus === 'connecting' || matchStatus === 'queued' || matchStatus === 'error') && (
        <div className="match-wait">
          <div className="panel">
            <h2>{matchStatus === 'error' ? '連線失敗' : '等待對手'}</h2>
            <p>
              {matchStatus === 'connecting' && '正在連上對戰伺服器…'}
              {matchStatus === 'queued' && '已進入佇列，對手按下連線對戰後會自動配對。'}
              {matchStatus === 'error' && (matchError ?? '無法連線')}
            </p>
            <button type="button" onClick={cancelMatchmaking}>取消</button>
          </div>
        </div>
      )}
      <MainMenu
        open={menuOpen}
        title="記憶烹飪"
        dismissible={inGame}
        onClose={closeMenu}
        hint={inGame ? '按 Esc 可關閉' : '選擇模式開始'}
        actions={
          inGame
            ? [
                { label: '繼續遊戲', onClick: closeMenu, primary: true },
                { label: '重新開始', onClick: () => start(recipe.id) },
                { label: '連線對戰', onClick: () => { closeMenu(); startMatchmaking(); } },
                { label: '回主選單', onClick: returnToTitle },
              ]
            : [
                { label: '開始遊戲', onClick: () => start(openingRecipe()), primary: true },
                { label: '連線對戰', onClick: () => { setMenuOpen(false); startMatchmaking(); } },
              ]
        }
      />
      <RecipePanel
        recipe={recipe}
        found={state.found}
        elapsed={elapsed}
        potRef={potRef}
        onDuel={() => { setMenuOpen(false); startMatchmaking(); }}
        onMenu={openMenu}
      />
      <section className="stage">
        <div className="hud" role="status">
          {!inGame && '主選單 · 選擇開始遊戲或連線對戰'}
          {inGame && menuOpen && '主選單已開啟 · Esc 繼續'}
          {inGame && !menuOpen && state.phase === 'preview' && (chefReady ? `用 ${seconds} 秒記住食材位置` : loadLabel)}
          {inGame && !menuOpen && state.phase === 'play' && state.open.length === 0 && `點一張牌，再接一張相同的 · ${formatElapsed(elapsed)}`}
          {inGame && !menuOpen && state.phase === 'play' && state.open.length > 0 && `再接一張相同的牌 · ${formatElapsed(elapsed)}`}
          {inGame && !menuOpen && state.phase === 'won' && `材料都進鍋了 · ${formatElapsed(elapsed)}`}
        </div>
        {inGame && state.phase === 'preview' && chefReady && !menuOpen && <div className="count">{seconds}</div>}
        {inGame && go && <div className="go">開始</div>}
        {inGame && state.last && state.phase === 'play' && (
          <div key={state.last.turn} className="banner correct">
            <span>{ingredientById(state.last.ingredientId).emoji}</span>
            一對入鍋
          </div>
        )}
        {modelFailed && <div className="load-error">角色模型載入失敗，點卡仍可以直接翻開。</div>}
        <Canvas
          className="board"
          orthographic
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [0, 18, 18], zoom: 60, near: 0.1, far: 120 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#f3e6d4']} />
          <FrameBoard />
          <hemisphereLight args={['#fff6ea', '#c49a72', 0.75]} />
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[6, 14, 8]}
            intensity={1.7}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={1}
            shadow-camera-far={42}
            shadow-camera-left={-9}
            shadow-camera-right={9}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
            shadow-bias={-0.0008}
          />
          <Table />
          <CardProjector projectRef={projectRef} />
          <CardGrid
            key={state.roundId}
            cards={state.cards}
            revealed={state.revealed}
            removed={state.removed}
            matched={state.matched}
            faceUp={inGame && state.phase === 'preview'}
            playable={inGame && state.phase === 'play' && !busy && !menuOpen}
            pendingIndex={busy ? goal?.index ?? null : null}
            dishId={recipe.id}
            onPick={onPick}
          />
          <Suspense fallback={null}>
            <ModelBoundary fallback={<SignalFail onFail={onModelFail} />}>
              <Character
                action={motion}
                goal={goal}
                roundId={state.roundId}
                onArrived={onArrived}
                onReady={() => setChefReady(true)}
                onPointDuration={(duration) => {
                  pointDuration.current = duration;
                }}
              />
            </ModelBoundary>
          </Suspense>
        </Canvas>
      </section>
      {dishPop && (
        <div className="dish-pop">
          <div className="pop-card">
            <span className="pop-food"><DishArt id={recipe.id} /></span>
            <strong>{recipe.name}</strong>
            <em>材料都進鍋了 · 用時 {formatElapsed(elapsed)}</em>
            <div>
              <button type="button" onClick={() => start(recipe.id)}>再做一次</button>
              {nextRecipe && (
                <button type="button" className="next" onClick={() => start(nextRecipe.id)}>下一道：{nextRecipe.name}</button>
              )}
              <button type="button" onClick={() => { setDishPop(false); startMatchmaking(); }}>連線對戰</button>
              <button type="button" onClick={returnToTitle}>主選單</button>
            </div>
          </div>
        </div>
      )}
      {flies.map((chip) => (
        <span
          key={chip.id}
          className="fly-chip"
          style={{
            left: chip.x,
            top: chip.y,
            ['--dx' as string]: `${chip.dx}px`,
            ['--dy' as string]: `${chip.dy}px`,
          }}
        >
          {chip.emoji}
        </span>
      ))}
    </div>
  );
}

function RecipePanel({
  recipe,
  found,
  elapsed,
  potRef,
  onDuel,
  onMenu,
}: {
  recipe: Recipe;
  found: string[];
  elapsed: number;
  potRef: RefObject<HTMLDivElement | null>;
  onDuel: () => void;
  onMenu: () => void;
}) {
  const foundSet = new Set(found);
  return (
    <aside className="recipe">
      <header className="brand brand-row">
        <div>
          <p>今日菜單</p>
          <h1>記憶烹飪</h1>
          <p className="play-clock">{formatElapsed(elapsed)} · 不限時</p>
        </div>
        <MenuToggleButton onClick={onMenu} />
      </header>
      <div className="paper">
        <div className="dish">
          <span className="plate"><DishArt id={recipe.id} /></span>
          <div>
            <p>要做的料理</p>
            <h2>{recipe.name}</h2>
            <p className="need">{recipe.ingredientIds.length} 種材料，每種要湊成一對</p>
          </div>
        </div>
        <div className="pot-dock" ref={potRef} aria-label="鍋">
          <span className="pot-dock-label">入鍋</span>
          <div className="pot-dock-fill">
            {found.length === 0 && <em>還沒有材料</em>}
            {found.map((id) => (
              <span key={id}>{ingredientById(id).emoji}</span>
            ))}
          </div>
        </div>
        <ol className="ings">
          {recipe.ingredientIds.map((id) => {
            const item = ingredientById(id);
            const got = foundSet.has(id);
            return (
              <li key={id} className={got ? 'got' : ''}>
                <i style={{ background: item.color }} />
                <span className="ing-icon">
                  {hasIngredientArt(id) ? <IngredientArt id={id} /> : item.emoji}
                </span>
                <b>{item.name}</b>
                <em>{got ? '入鍋' : ''}</em>
              </li>
            );
          })}
        </ol>
        <div className="meters">
          <div>
            <span>已入鍋</span>
            <strong>{found.length} / {recipe.ingredientIds.length}</strong>
          </div>
          <div>
            <span>用時</span>
            <strong>{formatElapsed(elapsed)}</strong>
            <em className="time-note">不限時</em>
          </div>
        </div>
        <p className="rule">連續揭開兩張相同的食材才算一對，一對會飛進鍋裡。對不上可以再接下一張，最早的一張會合上。計時開始後不限時，配齊材料就完成。</p>
        <div className="duel-entry">
          <button type="button" onClick={onDuel}>連線對戰</button>
          <MenuToggleButton onClick={onMenu} />
        </div>
      </div>
    </aside>
  );
}

