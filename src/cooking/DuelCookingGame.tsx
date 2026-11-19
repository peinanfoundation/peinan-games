import { useProgress } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Component, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { CardGrid, CardProjector, FrameBoard, Table } from './Board';
import { Character, type WalkGoal } from './Character';
import { DishArt } from './dishArt';
import { IngredientThumb } from './IngredientThumb';
import { ingredientById, ingredientImageUrl, recipeById } from './ingredients';
import { HOME_P1, HOME_P2, slotPosition } from './layout';
import { MainMenu, MenuToggleButton } from './MainMenu';
import { formatElapsed, visibleOpens } from './logic';
import type { RoomSnapshot, SeatView, ServerMessage } from './matchProtocol';
import './cooking.css';

interface FlyChip {
  id: number;
  ingredientId: string;
  emoji: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
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

function seatGoal(seat: SeatView): WalkGoal | null {
  if (seat.goalIndex === null) return null;
  const spot = slotPosition(seat.goalIndex);
  return { index: seat.goalIndex, x: spot.x, z: spot.z };
}

interface DuelCookingGameProps {
  seat: 0 | 1;
  room: RoomSnapshot;
  send: (message: { type: 'walkTo'; index: number } | { type: 'reveal'; index: number } | { type: 'motionDone' }) => void;
  onLeave: () => void;
  onRoom: (room: RoomSnapshot) => void;
  listen: (handler: (message: ServerMessage) => void) => () => void;
}

export function DuelCookingGame({ seat, room: initial, send, onLeave, onRoom, listen }: DuelCookingGameProps) {
  const [room, setRoom] = useState(initial);
  const [seconds, setSeconds] = useState(10);
  const [elapsed, setElapsed] = useState(0);
  const [go, setGo] = useState(false);
  const [chefReady, setChefReady] = useState(false);
  const readyCount = useRef(0);
  const [flies, setFlies] = useState<FlyChip[]>([]);
  const [flash, setFlash] = useState<number[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const timers = useRef<number[]>([]);
  const pointDuration = useRef(2.43);
  const projectRef = useRef<((index: number) => { x: number; y: number }) | null>(null);
  const potRef = useRef<HTMLDivElement>(null);
  const flySerial = useRef(0);
  const roomRef = useRef(room);
  roomRef.current = room;
  const { active, progress } = useProgress();
  const myRecipe = recipeById(room.recipeIds[seat]!);
  const foeRecipe = recipeById(room.recipeIds[seat === 0 ? 1 : 0]!);
  const me = room.seats[seat]!;

  useEffect(() => {
    return listen((message) => {
      if (message.type === 'room' || message.type === 'matched') {
        const next = message.type === 'matched' ? message.room : message.room;
        setRoom(next);
        onRoom(next);
      }
    });
  }, [listen, onRoom]);

  useEffect(() => () => {
    for (const id of timers.current) window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (room.phase !== 'preview' || !room.previewEndsAt) return undefined;
    const tick = () => {
      const left = Math.max(0, Math.ceil((room.previewEndsAt! - Date.now()) / 1000));
      setSeconds(left);
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [room.phase, room.previewEndsAt, room.roomId]);

  useEffect(() => {
    if (room.phase !== 'play' || !room.startedAt) {
      if (room.phase === 'preview') setElapsed(0);
      return undefined;
    }
    const id = window.setInterval(() => {
      const mine = roomRef.current.seats[seat]!;
      if (mine.finishedAt !== null) {
        setElapsed(Math.floor(mine.finishedAt / 1000));
        return;
      }
      setElapsed(Math.floor((Date.now() - roomRef.current.startedAt!) / 1000));
    }, 200);
    return () => window.clearInterval(id);
  }, [room.phase, room.startedAt, room.roomId, seat]);

  useEffect(() => {
    if (room.phase !== 'play') return undefined;
    setGo(true);
    const id = window.setTimeout(() => setGo(false), 900);
    return () => window.clearTimeout(id);
  }, [room.phase, room.roomId]);

  useEffect(() => {
    if (!room.lastMatch) return;
    setFlash(room.lastMatch.matched);
    const id = window.setTimeout(() => setFlash([]), 700);
    return () => window.clearTimeout(id);
  }, [room.lastMatch?.turn]);

  const flyPair = (matched: number[], ingredientId: string) => {
    const project = projectRef.current;
    const pot = potRef.current?.getBoundingClientRect();
    if (!project || !pot) return;
    const toX = pot.left + pot.width * 0.46;
    const toY = pot.top + pot.height * 0.58;
    const emoji = ingredientById(ingredientId).emoji;
    const chips = matched.map((slot) => {
      const from = project(slot);
      const id = flySerial.current;
      flySerial.current += 1;
      return { id, ingredientId, emoji, x: from.x, y: from.y, dx: toX - from.x, dy: toY - from.y };
    });
    setFlies((list) => [...list, ...chips]);
    window.setTimeout(() => {
      setFlies((list) => list.filter((chip) => !chips.some((item) => item.id === chip.id)));
    }, 760);
  };

  useEffect(() => {
    if (!room.lastMatch || room.lastMatch.seat !== seat) return;
    flyPair(room.lastMatch.matched, room.lastMatch.ingredientId);
  }, [room.lastMatch?.turn, seat]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Escape') return;
      event.preventDefault();
      setMenuOpen((open) => !open);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onPick = (index: number) => {
    if (menuOpen || room.phase !== 'play' || me.busy || me.finishedAt !== null) return;
    if (me.open.includes(index) || me.cleared.includes(index)) return;
    send({ type: 'walkTo', index });
  };

  const onArrivedMine = () => {
    const goal = roomRef.current.seats[seat]?.goalIndex;
    if (goal === null || goal === undefined) return;
    send({ type: 'reveal', index: goal });
    const duration = pointDuration.current || 2.43;
    const remain = Math.max(280, Math.round(duration * 1000) - Math.round(duration * 380));
    timers.current.push(window.setTimeout(() => send({ type: 'motionDone' }), remain));
  };

  const markReady = useCallback(() => {
    readyCount.current += 1;
    if (readyCount.current >= 2) setChefReady(true);
  }, []);

  const loadLabel = active ? `廚師準備中 ${Math.round(progress)}%` : '廚師準備中';
  const revealed = visibleOpens(room.seats.map((item) => ({
    found: item.found,
    mistakes: item.mistakes,
    cleared: item.cleared,
    open: item.open,
    finishedAt: item.finishedAt,
  })));
  const need = myRecipe.ingredientIds.length;

  return (
    <div className="cook duel">
      <MainMenu
        open={menuOpen}
        dismissible
        onClose={() => setMenuOpen(false)}
        hint="按 Esc 可關閉"
        actions={[
          { label: '繼續對戰', onClick: () => setMenuOpen(false), primary: true },
          { label: '離開對戰', onClick: onLeave },
        ]}
      />
      <aside className="recipe">
        <header className="brand brand-row">
          <div className="brand-copy">
            <p>連線對戰</p>
            <h1>記憶烹飪</h1>
            <p className="play-clock">你是 {seat === 0 ? '1P · Granny' : '2P · Aj'}</p>
          </div>
          <MenuToggleButton onClick={() => setMenuOpen(true)} />
        </header>
        <div className="paper">
          <div className="dish">
            <span className="plate"><DishArt id={myRecipe.id} /></span>
            <div>
              <p className="side-extra">你的菜單</p>
              <h2>{myRecipe.name}</h2>
              <p className="need side-extra">{need} 種材料，各自湊對</p>
            </div>
          </div>
          <div className="foe-menu side-extra">
            <span className="plate small"><DishArt id={foeRecipe.id} /></span>
            <div>
              <p>對手菜單</p>
              <strong>{foeRecipe.name}</strong>
              <em>同樣 {need} 種材料</em>
            </div>
          </div>
          <div className="pot-dock side-extra" ref={potRef} aria-label="鍋">
            <span className="pot-dock-label">你的鍋</span>
            <div className="pot-dock-fill">
              {me.found.length === 0 && <em>還沒有材料</em>}
              {me.found.map((id) => (
                <IngredientThumb key={id} id={id} className="ing-thumb pot-thumb" />
              ))}
            </div>
          </div>
          <div className="duel-scores side-extra">
            <div className={seat === 0 ? 'you' : ''}>
              <span>1P · {recipeById(room.recipeIds[0]!).name}</span>
              <strong>{room.seats[0]!.found.length}/{need}</strong>
              <em>
                {room.seats[0]!.finishedAt !== null
                  ? formatElapsed(Math.floor(room.seats[0]!.finishedAt / 1000))
                  : seat === 0 && room.phase === 'play'
                    ? formatElapsed(elapsed)
                    : '—'}
              </em>
            </div>
            <div className={seat === 1 ? 'you' : ''}>
              <span>2P · {recipeById(room.recipeIds[1]!).name}</span>
              <strong>{room.seats[1]!.found.length}/{need}</strong>
              <em>
                {room.seats[1]!.finishedAt !== null
                  ? formatElapsed(Math.floor(room.seats[1]!.finishedAt / 1000))
                  : seat === 1 && room.phase === 'play'
                    ? formatElapsed(elapsed)
                    : '—'}
              </em>
            </div>
          </div>
          <ol className="ings">
            {myRecipe.ingredientIds.map((id) => {
              const item = ingredientById(id);
              const got = me.found.includes(id);
              return (
                <li key={id} className={got ? 'got' : ''}>
                  <i style={{ background: item.color }} />
                  <span className="ing-icon">
                    <IngredientThumb id={id} />
                  </span>
                  <b>{item.name}</b>
                  <em>{got ? '入鍋' : ''}</em>
                </li>
              );
            })}
          </ol>
          <p className="rule side-extra">同一副牌，看得到對方翻開的牌。菜單不同，但材料數量一樣。各自連鎖、各自入鍋。</p>
          {(room.disconnected[0] || room.disconnected[1]) && (
            <p className="rule side-extra">對手已離線，你可以繼續做完或離開。</p>
          )}
          <button type="button" className="duel-leave side-extra" onClick={onLeave}>離開對戰</button>
          <div className="side-extra">
            <MenuToggleButton onClick={() => setMenuOpen(true)} />
          </div>
        </div>
      </aside>
      <section className="stage">
        <div className="hud" role="status">
          {menuOpen && '主選單已開啟 · Esc 繼續'}
          {!menuOpen && room.phase === 'preview' && (chefReady ? `用 ${seconds} 秒記住食材位置` : loadLabel)}
          {!menuOpen && room.phase === 'play' && me.finishedAt === null && `再接一張相同的牌 · ${formatElapsed(elapsed)}`}
          {!menuOpen && room.phase === 'play' && me.finishedAt !== null && `你已完成 · ${formatElapsed(Math.floor(me.finishedAt / 1000))}，等對手`}
          {!menuOpen && room.phase === 'finished' && '雙方都完成了'}
        </div>
        {room.phase === 'preview' && chefReady && <div className="count">{seconds}</div>}
        {go && <div className="go">開始</div>}
        {room.lastMatch && (
          <div key={room.lastMatch.turn} className="banner correct">
            <IngredientThumb id={room.lastMatch.ingredientId} className="ing-thumb banner-thumb" />
            {room.lastMatch.seat === seat ? '你入鍋一對' : '對手入鍋一對'}
          </div>
        )}
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
          <directionalLight position={[6, 14, 8]} intensity={1.7} castShadow />
          <Table />
          <CardProjector projectRef={projectRef} />
          <CardGrid
            key={`${room.roomId}-${myRecipe.id}`}
            cards={room.cards}
            revealed={revealed}
            removed={[]}
            matched={flash}
            faceUp={room.phase === 'preview'}
            playable={room.phase === 'play' && !me.busy && me.finishedAt === null && !menuOpen}
            pendingIndex={me.busy ? me.goalIndex : null}
            dishId={myRecipe.id}
            seatOpens={[room.seats[0]!.open, room.seats[1]!.open]}
            lockedOpens={me.open}
            blocked={me.cleared}
            onPick={onPick}
          />
          <Suspense fallback={null}>
            <ModelBoundary fallback={<SignalFail onFail={markReady} />}>
              <Character
                modelUrl={`${import.meta.env.BASE_URL}models/granny.fbx`}
                home={HOME_P1}
                action={room.seats[0]!.motion}
                goal={seatGoal(room.seats[0]!)}
                roundId={Number(room.roomId.replace(/\D/g, '')) || 1}
                onArrived={seat === 0 ? onArrivedMine : () => undefined}
                onReady={markReady}
                onPointDuration={(duration) => {
                  if (seat === 0) pointDuration.current = duration;
                }}
              />
            </ModelBoundary>
            <ModelBoundary fallback={<SignalFail onFail={markReady} />}>
              <Character
                modelUrl={`${import.meta.env.BASE_URL}models/aj.fbx`}
                home={HOME_P2}
                action={room.seats[1]!.motion}
                goal={seatGoal(room.seats[1]!)}
                roundId={Number(room.roomId.replace(/\D/g, '')) || 1}
                onArrived={seat === 1 ? onArrivedMine : () => undefined}
                onReady={markReady}
                onPointDuration={(duration) => {
                  if (seat === 1) pointDuration.current = duration;
                }}
              />
            </ModelBoundary>
          </Suspense>
        </Canvas>
      </section>
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
          <img src={ingredientImageUrl(chip.ingredientId)} alt="" draggable={false} />
        </span>
      ))}
      {room.phase === 'finished' && (
        <div className="dish-pop">
          <div className="pop-card">
            <span className="pop-food"><DishArt id={myRecipe.id} /></span>
            <strong>對戰結束</strong>
            <em>
              1P {recipeById(room.recipeIds[0]!).name} {formatElapsed(Math.floor((room.seats[0]!.finishedAt ?? 0) / 1000))}
              {' · '}
              2P {recipeById(room.recipeIds[1]!).name} {formatElapsed(Math.floor((room.seats[1]!.finishedAt ?? 0) / 1000))}
            </em>
            <div>
              <button type="button" onClick={onLeave}>回到單人</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
