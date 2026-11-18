import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { createSim, pressSpace, skipCatch, stepIndex, tick, type Mode, type Sim } from './flow';
import { BITE_WINDOW, FISHES, GAUGE_STOPS, TIER_NAMES, TUG_SECONDS, tierOf, type Award } from './logic';
import { FISH_PHOTO_FACE, FISH_PHOTOS, loadFishPhotos } from './photos';
import { drawWorld } from './scene';
import './fishing.css';

interface Hud {
  mode: Mode;
  message: string;
  detail: string;
  score: number;
  streak: number;
  catches: number;
  seen: string[];
  fishId: string;
  fishName: string;
  fishSpecies: string;
  fishBody: string;
  safeHalf: number;
  award: Award | null;
  tierName: string;
  repeat: boolean;
}

const STEPS = ['等上釣', '停中間', '拉扯'];

function toHud(sim: Sim): Hud {
  return {
    mode: sim.mode,
    message: sim.message,
    detail: sim.detail,
    score: sim.score,
    streak: sim.streak,
    catches: sim.catches,
    seen: sim.seen,
    fishId: sim.fish?.id ?? '',
    fishName: sim.fish?.name ?? '',
    fishSpecies: sim.fish?.species ?? '',
    fishBody: sim.fish?.body ?? '#e07a3d',
    safeHalf: sim.fish?.safeHalf ?? 0.4,
    award: sim.award,
    tierName: TIER_NAMES[tierOf(sim.catches)],
    repeat: sim.repeat,
  };
}

function segments() {
  let from = 0;
  return GAUGE_STOPS.map((stop) => {
    const width = (stop.at - from) * 100;
    from = stop.at;
    return { zone: stop.zone, width };
  });
}

const ZONE_SEGMENTS = segments();

function makeRng() {
  let state = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function makeSound() {
  let ctx: AudioContext | null = null;
  const unlock = () => {
    const Ctx = window.AudioContext;
    if (!ctx) ctx = new Ctx();
    if (ctx.state === 'suspended') void ctx.resume();
  };
  const tone = (freq: number, dur: number, type: OscillatorType, gain: number, when = 0) => {
    if (!ctx) return;
    const start = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    amp.gain.setValueAtTime(gain, start);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  };
  return {
    unlock,
    bite: () => {
      tone(620, 0.07, 'square', 0.04);
      tone(880, 0.1, 'square', 0.04, 0.08);
    },
    hook: () => tone(520, 0.06, 'triangle', 0.05),
    fail: () => {
      tone(196, 0.18, 'triangle', 0.05);
      tone(140, 0.24, 'triangle', 0.04, 0.1);
    },
    win: () => {
      [523, 659, 784, 1046].forEach((freq, index) => tone(freq, 0.16, 'triangle', 0.05, index * 0.08));
    },
  };
}

export function FishingGame() {
  const simRef = useRef<Sim | null>(null);
  if (simRef.current === null) simRef.current = createSim();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const fishRef = useRef<HTMLDivElement>(null);
  const slipRef = useRef<HTMLSpanElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const biteRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLButtonElement>(null);
  const rightRef = useRef<HTMLButtonElement>(null);
  const spaceApi = useRef(() => {});
  const skipApi = useRef(() => {});
  const keys = useRef({ left: false, right: false });
  const [hud, setHud] = useState<Hud>(() => toHud(simRef.current as Sim));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    loadFishPhotos();
    const rng = makeRng();
    const sound = makeSound();
    const held = keys.current;
    let frame = 0;
    let last = performance.now();
    let clock = 0;
    let signature = '';
    let queued = false;
    let skipQueued = false;
    let shown: Mode = 'title';

    const publish = (sim: Sim) => {
      if (sim.mode !== shown) {
        if (sim.mode === 'bite') sound.bite();
        if (sim.mode === 'gauge') sound.hook();
        if (sim.mode === 'miss') sound.fail();
        if (sim.mode === 'lift') sound.win();
        shown = sim.mode;
      }
      const next = JSON.stringify(toHud(sim));
      if (next !== signature) {
        signature = next;
        setHud(toHud(sim));
      }
    };

    spaceApi.current = () => {
      sound.unlock();
      queued = true;
    };
    skipApi.current = () => {
      sound.unlock();
      skipQueued = true;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === 'Space') {
        event.preventDefault();
        sound.unlock();
        queued = true;
      }
      if (event.code === 'ArrowDown' || event.code === 'Escape') {
        event.preventDefault();
        sound.unlock();
        skipQueued = true;
      }
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        event.preventDefault();
        sound.unlock();
        if (event.code === 'ArrowLeft') held.left = true;
        else held.right = true;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'ArrowLeft') held.left = false;
      if (event.code === 'ArrowRight') held.right = false;
    };
    const onBlur = () => {
      held.left = false;
      held.right = false;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;
      let sim = simRef.current as Sim;
      if (skipQueued) {
        sim = skipCatch(sim, rng);
        skipQueued = false;
        queued = false;
      } else if (queued) {
        sim = pressSpace(sim, rng);
        queued = false;
      }
      sim = tick(sim, dt, held, rng);
      simRef.current = sim;
      publish(sim);

      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawWorld(ctx, rect.width, rect.height, {
        time: clock,
        mode: sim.mode,
        fish: sim.fish,
        fishX: sim.tug?.x ?? (sim.mode === 'miss' ? 1 : 0),
        phase: sim.modeTime,
        shake: sim.shake,
        tier: tierOf(sim.catches),
      });

      if (needleRef.current) needleRef.current.style.left = `${sim.marker * 100}%`;
      if (biteRef.current) {
        const left = sim.mode === 'bite' ? Math.max(0, 1 - sim.modeTime / BITE_WINDOW) : 0;
        biteRef.current.style.transform = `scaleX(${left})`;
      }
      if (sim.tug && sim.fish) {
        const place = Math.min(1, Math.max(0, (sim.tug.x + 1) / 2));
        if (fishRef.current) fishRef.current.style.left = `${place * 100}%`;
        if (slipRef.current) slipRef.current.style.width = `${Math.min(100, (sim.tug.slip / sim.fish.slipLimit) * 100)}%`;
        if (clockRef.current) clockRef.current.textContent = Math.max(0, TUG_SECONDS - sim.tug.elapsed).toFixed(1);
        const hot = sim.tug.slip > sim.fish.slipLimit * 0.45;
        panelRef.current?.setAttribute('data-hot', hot ? 'true' : 'false');
        leftRef.current?.classList.toggle('hot', sim.mode === 'tug' && sim.tug.intent > 0);
        rightRef.current?.classList.toggle('hot', sim.mode === 'tug' && sim.tug.intent < 0);
      } else {
        panelRef.current?.setAttribute('data-hot', 'false');
        leftRef.current?.classList.remove('hot');
        rightRef.current?.classList.remove('hot');
      }

      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      spaceApi.current = () => {};
      skipApi.current = () => {};
    };
  }, []);

  const hold = (dir: 'left' | 'right') => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      keys.current[dir] = true;
    },
    onPointerUp: () => {
      keys.current[dir] = false;
    },
    onPointerCancel: () => {
      keys.current[dir] = false;
    },
  });

  const step = stepIndex(hud.mode);
  const safeLeft = ((1 - hud.safeHalf) / 2) * 100;
  const safeWidth = hud.safeHalf * 100;

  return (
    <div className="fish-game">
      <canvas ref={canvasRef} aria-hidden="true" />
      {hud.mode === 'title' ? (
        <div className="scrim">
          <section className="title-card">
            <h1>釣魚</h1>
            <p className="hint">坐在小船上，在河流上。</p>
            <ol>
              <li>等魚上釣（大約 3 到 6 秒）再按空白鍵。魚線會一直左右擺。</li>
              <li>有一條色條，標記要停在中間綠色，否則魚走失，從頭再來。</li>
              <li>接著拉扯約 10 秒。魚往右逃就按 ←，往左逃就按 →。魚離開範圍太久就算拉扯不足。</li>
              <li>釣起來就加分，然後繼續。同一種再上鉤，按 ↓ 跳過。越往後，魚種會換著出現。食人魚釣上來會扣分。</li>
            </ol>
            <div className="kinds">
              {FISHES.map((fish) => (
                <span key={fish.id} className={fish.points < 0 ? 'penalty' : undefined}>
                  <img
                    src={FISH_PHOTOS[fish.id]}
                    alt=""
                    style={{ transform: FISH_PHOTO_FACE[fish.id] === -1 ? 'scaleX(-1)' : undefined }}
                  />
                  {fish.name === fish.species ? fish.name : `${fish.name}・${fish.species}`} {fish.points < 0 ? `扣${-fish.points}分` : `${fish.points}分`}
                </span>
              ))}
            </div>
            <button type="button" onClick={() => spaceApi.current()}>
              開始垂釣
            </button>
          </section>
        </div>
      ) : (
        <>
          <header className="topbar">
            <div className="scorecard">
              <strong>{hud.score}</strong>
              <span>{hud.tierName}{hud.streak > 1 ? ` · 連續 ${hud.streak}` : ''}</span>
              <div className="pips">
                {FISHES.map((fish) => (
                  <i
                    key={fish.id}
                    className={hud.seen.includes(fish.id) ? 'on' : ''}
                    title={`${fish.species}・${fish.note}`}
                    style={{ ['--fish' as string]: fish.body }}
                  />
                ))}
              </div>
            </div>
            <div className="steps" aria-hidden="true">
              {STEPS.map((label, index) => (
                <b key={label} className={step === index + 1 ? 'on' : ''}>{index + 1} {label}</b>
              ))}
            </div>
          </header>
          <div className="dock">
            <section
              className="panel"
              data-mode={hud.mode}
              data-penalty={hud.mode === 'lift' && (hud.award?.total ?? 0) < 0 ? 'true' : 'false'}
              ref={panelRef}
              aria-live="polite"
            >
              <h2>
                {hud.message}
                {hud.mode === 'tug' && <span className="clock" ref={clockRef}>10.0</span>}
              </h2>
              <p className="hint">{hud.mode === 'tug' && hud.fishSpecies ? `${hud.fishSpecies}　` : ''}{hud.detail}</p>
              {hud.mode === 'bite' && <div className="window"><span ref={biteRef} /></div>}
              {hud.mode === 'gauge' && (
                <div className="meter">
                  <div className="zones" aria-hidden="true">
                    {ZONE_SEGMENTS.map((segment, index) => (
                      <i key={`${segment.zone}-${index}`} className={segment.zone} style={{ width: `${segment.width}%` }} />
                    ))}
                  </div>
                  <div className="needle" ref={needleRef} />
                </div>
              )}
              {hud.mode === 'tug' && (
                <>
                  <div className="track" aria-hidden="true">
                    <div className="safe" style={{ left: `${safeLeft}%`, width: `${safeWidth}%` }} />
                    <div
                      className="tug-fish"
                      ref={fishRef}
                      style={{
                        backgroundImage: FISH_PHOTOS[hud.fishId] ? `url(${FISH_PHOTOS[hud.fishId]})` : undefined,
                        transform: FISH_PHOTO_FACE[hud.fishId] === -1 ? 'scaleX(-1)' : 'none',
                      }}
                    />
                  </div>
                  <div className="slip"><span ref={slipRef} /></div>
                </>
              )}
              {hud.mode === 'lift' && hud.award && (
                <p className="award">
                  {hud.award.base < 0 ? `扣 ${-hud.award.base} 分` : `${hud.award.base} 分`}
                  {hud.award.perfect > 0 ? `　正中 +${hud.award.perfect}` : ''}
                  {hud.award.steady > 0 ? `　拉得穩 +${hud.award.steady}` : ''}
                </p>
              )}
            </section>
            {hud.repeat && (hud.mode === 'gauge' || hud.mode === 'tug' || hud.mode === 'lift') && (
              <button type="button" className="skip" onClick={() => skipApi.current()}>↓ 跳過</button>
            )}
            <div className="pad">
              <button type="button" ref={leftRef} {...hold('left')}>← 左拉</button>
              <button type="button" onClick={() => spaceApi.current()}>
                {hud.mode === 'bite' ? '上釣' : hud.mode === 'gauge' ? '停下' : '空白鍵'}
              </button>
              <button type="button" ref={rightRef} {...hold('right')}>右拉 →</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
