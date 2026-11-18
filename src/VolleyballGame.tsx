import { useEffect, useRef, useState } from 'react';
import {
  WIN_SCORE,
  beginMatch,
  cpuPoint,
  createSim,
  keyForZone,
  pressZone,
  step,
  zoneFromKey,
  zonePoint,
  type Phase,
  type Sim,
} from './volleyballSim';
import './volleyball.css';

const HAIR = ['#3a2a1a', '#1c1c1c', '#e2b043', '#6a3a22', '#c46a4a', '#2d4a86'];
const CPU_HAIR = ['#2b2b2b', '#8b4518', '#f2d16b', '#4a2c2c', '#d98bb0', '#1f3b2c'];
const KINDS = [5, 0, 2, 4, 1, 3];
const CONFETTI = ['#ff5a7a', '#ffd21a', '#2f6bff', '#3ecf8e', '#ff8a3d', '#ffffff'];

function zoneFromCode(code: string) {
  if (code.startsWith('Digit') || code.startsWith('Numpad')) {
    return zoneFromKey(Number(code.replace(/\D/g, '')));
  }
  return null;
}

function toneOf(message: string) {
  if (message.includes('好') || message.includes('連擊') || message.includes('決勝') || message.includes('你贏')) return 'good';
  if (message.includes('慢') || message.includes('錯') || message.includes('電腦贏')) return 'bad';
  return 'info';
}

let audioCtx: AudioContext | null = null;

function ensureAudio() {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, when = 0) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + when;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(amp);
  amp.connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function Hair({ kind, color, front }: { kind: number; color: string; front: boolean }) {
  return (
    <g>
      {front ? (
        <path d="M24 30 Q24 12 40 11 Q56 12 56 30 Q49 22 40 23 Q31 22 24 30" fill={color} />
      ) : (
        <ellipse cx="40" cy="26" rx="16.5" ry="15" fill={color} />
      )}
      {kind === 1 && <circle cx="40" cy="12" r="4" fill="#ff5a7a" />}
      {kind === 2 && <rect x="24" y="20" width="32" height="5" rx="2.5" fill="#ffe14a" />}
      {kind === 3 && <circle cx="54" cy="16" r="5.5" fill={color} />}
      {kind === 4 && <path d="M28 18 L34 6 L38 16 L44 5 L50 16 L56 8 L58 20" fill={color} />}
      {kind === 5 && <path d="M22 26 H58 L52 14 H40 L34 20 H26 Z" fill="#2f6bff" />}
    </g>
  );
}

function Athlete({
  facing,
  hair,
  kind,
  jersey,
  shorts,
  number,
}: {
  facing: 'front' | 'back';
  hair: string;
  kind: number;
  jersey: string;
  shorts: string;
  number?: number;
}) {
  const skin = '#ffd0b4';
  return (
    <svg viewBox="0 0 80 108" className="vg-athlete" aria-hidden="true">
      <ellipse cx="40" cy="102" rx="18" ry="5" fill="rgba(0,0,0,0.18)" />
      <ellipse cx="29" cy="96" rx="8" ry="4.2" fill="#2c2c2c" />
      <ellipse cx="51" cy="96" rx="8" ry="4.2" fill="#2c2c2c" />
      <rect x="24" y="78" width="10" height="16" rx="4" fill={skin} />
      <rect x="46" y="78" width="10" height="16" rx="4" fill={skin} />
      <path d="M20 68 h40 v14 H48 l-4 8 -4-8 H20z" fill={shorts} />
      <rect x="18" y="46" width="44" height="28" rx="10" fill={jersey} />
      <rect x="18" y="46" width="44" height="7" rx="4" fill="rgba(255,255,255,0.28)" />
      <g className="vg-arm vg-arm-l">
        <rect x="2" y="50" width="18" height="8" rx="4" fill={skin} />
      </g>
      <g className="vg-arm vg-arm-r">
        <rect x="60" y="50" width="18" height="8" rx="4" fill={skin} />
      </g>
      {number != null && (
        <text x="40" y="67" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff">
          {number}
        </text>
      )}
      <rect x="34" y="38" width="12" height="10" rx="4" fill={skin} />
      <circle cx="40" cy="28" r="16" fill={skin} />
      <Hair kind={kind} color={hair} front={facing === 'front'} />
      {facing === 'front' && (
        <g>
          <circle cx="33" cy="30" r="2.1" fill="#2b2118" />
          <circle cx="47" cy="30" r="2.1" fill="#2b2118" />
          <circle cx="33.7" cy="29.3" r="0.7" fill="#fff" />
          <circle cx="47.7" cy="29.3" r="0.7" fill="#fff" />
          <path d="M34 36 Q40 40 46 36" stroke="#d47b74" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <ellipse cx="27" cy="34" rx="3" ry="1.7" fill="#ffb6b6" opacity="0.75" />
          <ellipse cx="53" cy="34" rx="3" ry="1.7" fill="#ffb6b6" opacity="0.75" />
        </g>
      )}
    </svg>
  );
}

function Ball() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="#fffef8" stroke="#243044" strokeWidth="3" />
      <path d="M8 24 C22 30 42 20 56 28" stroke="#243044" strokeWidth="3" fill="none" />
      <path d="M12 44 C26 34 42 42 54 34" stroke="#243044" strokeWidth="3" fill="none" />
      <path d="M30 6 C26 22 36 42 30 58" stroke="#f0b429" strokeWidth="4" fill="none" />
    </svg>
  );
}

export function VolleyballGame() {
  const simRef = useRef<Sim | null>(null);
  if (simRef.current === null) simRef.current = createSim();
  const sim = simRef.current;
  const [, setTick] = useState(0);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const prevRef = useRef({ score: 0, cpu: 0, phase: 'menu' as Phase });
  const bumpRef = useRef<() => void>(() => {});
  bumpRef.current = () => setTick((n) => (n + 1) % 100000);

  useEffect(() => {
    const prevTitle = document.title;
    const prevOverflow = document.body.style.overflow;
    document.title = '鳥瞰排球';
    document.body.style.overflow = 'hidden';
    return () => {
      document.title = prevTitle;
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const current = simRef.current;
      if (!current || document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(50, Math.max(0, now - last));
      last = now;
      step(current, now, dt);
      const prev = prevRef.current;
      if (!mutedRef.current && audioCtx) {
        if (current.score > prev.score) {
          tone(620, 0.08, 'triangle', 0.05);
          tone(880, 0.12, 'triangle', 0.04, 0.07);
        } else if (current.cpuScore > prev.cpu) {
          tone(160, 0.2, 'sawtooth', 0.035);
        } else if (current.phase === 'gameover' && prev.phase !== 'gameover') {
          if (current.winner === 'us') {
            tone(523, 0.1, 'triangle', 0.05);
            tone(659, 0.1, 'triangle', 0.05, 0.1);
            tone(784, 0.18, 'triangle', 0.05, 0.2);
          } else {
            tone(196, 0.22, 'triangle', 0.04);
            tone(146, 0.28, 'triangle', 0.04, 0.16);
          }
        }
      }
      prevRef.current = { score: current.score, cpu: current.cpuScore, phase: current.phase };
      bumpRef.current();
    }, 16);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const current = simRef.current;
      if (!current) return;
      const zone = zoneFromCode(event.code);
      if (zone) {
        event.preventDefault();
        current.pressed = zone;
        current.pressedUntil = performance.now() + 140;
        if (current.phase === 'menu' || current.phase === 'gameover') return;
        pressZone(current, zone, performance.now());
        bumpRef.current();
        return;
      }
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        if (current.phase === 'menu' || current.phase === 'gameover') start();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function start() {
    const current = simRef.current;
    if (!current) return;
    ensureAudio();
    beginMatch(current, performance.now());
    bumpRef.current();
  }

  function onZone(zone: number) {
    const current = simRef.current;
    if (!current) return;
    current.pressed = zone;
    current.pressedUntil = performance.now() + 140;
    if (current.phase === 'menu' || current.phase === 'gameover') return;
    pressZone(current, zone, performance.now());
    bumpRef.current();
  }

  const prompt =
    sim.phase === 'toPlayer' && sim.flash
      ? `按 ${keyForZone(sim.targetZone)}`
      : sim.phase === 'toCpu' || sim.phase === 'contact'
        ? '回擊！'
        : '';
  const result =
    sim.message && sim.phase !== 'menu' && sim.phase !== 'gameover' && sim.message !== '電腦發球'
      ? sim.message
      : '';
  const banner = result || prompt;

  const ballStyle = {
    left: `${sim.ball.x * 100}%`,
    top: `${sim.ball.y * 100}%`,
    transform: `translateY(${-sim.ball.h * 72}px) scale(${0.82 + sim.ball.h * 0.45}) rotate(${sim.now / 4}deg)`,
  };
  const shadowStyle = {
    left: `${sim.ball.x * 100}%`,
    top: `${sim.ball.y * 100}%`,
    opacity: 0.34 - sim.ball.h * 0.18,
    transform: `scale(${1.05 - sim.ball.h * 0.45}, ${0.85 - sim.ball.h * 0.2})`,
  };

  return (
    <div
      className="vg-root"
      data-phase={sim.phase}
      data-target={sim.phase === 'toPlayer' && sim.flash ? sim.targetZone : ''}
      data-score={sim.score}
      data-cpu={sim.cpuScore}
    >
      <header>
        <div className="vg-top">
          <button
            type="button"
            className="vg-ghost"
            onClick={() => {
              mutedRef.current = !mutedRef.current;
              setMuted(mutedRef.current);
            }}
          >
            {muted ? '音效關' : '音效開'}
          </button>
        </div>
        <div className="vg-hud">
          <div className="vg-score us">
            <span className="label">我方</span>
            <span className="n">{sim.score}</span>
            <span className="best">最高 {sim.best}</span>
          </div>
          <div className="vg-title">
            <strong>鳥瞰排球</strong>
            <span className="rule">先得 {WIN_SCORE} 分</span>
            <span className={`vg-prompt${result ? ` ${toneOf(result)}` : banner.startsWith('按') ? '' : ' go'}`} role="status">{banner}</span>
            <span className="vg-combo">{sim.combo >= 2 ? `連擊 ${sim.combo}` : ''}</span>
          </div>
          <div className="vg-score cpu">
            <span className="label">電腦</span>
            <span className="n">{sim.cpuScore}</span>
            <span className="best">連擊最高 {sim.bestCombo}</span>
          </div>
        </div>
      </header>

      <div className="vg-play">
      <div className="vg-stage">
        <div className="vg-frame">
          <div className="vg-tag far">遠 · 電腦隊</div>
          <div className="vg-tag near">近 · 我方</div>
          <div className={`vg-court${sim.now < sim.shakeUntil ? ' shake' : ''}`}>
            <div className="vg-half cpu" />
            <div className="vg-cpu-grid" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => <span key={i} />)}
            </div>
            <div className="vg-half us">
              {[1, 2, 3, 4, 5, 6].map((zone) => {
                const hot = sim.phase === 'toPlayer' && sim.flash && sim.targetZone === zone;
                return (
                  <button
                    key={zone}
                    type="button"
                    className={hot ? 'vg-zone hot' : 'vg-zone'}
                    aria-label={`第 ${zone} 區，按 ${keyForZone(zone)}`}
                    onClick={() => onZone(zone)}
                  >
                    <span className="vg-zone-no">{keyForZone(zone)}</span>
                    {hot && (
                      <span
                        key={sim.rally}
                        className="vg-timer"
                        style={{ animationDuration: `${sim.windowMs || sim.duration}ms` }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="vg-net" />
            <span className="vg-post left" />
            <span className="vg-post right" />
            {Array.from({ length: 6 }, (_, index) => {
              const point = cpuPoint(index);
              const hitting = sim.hitCpu === index && sim.now < sim.hitCpuUntil;
              const scale = index < 3 ? 0.72 : 0.84;
              return (
                <div
                  key={`cpu-${index}`}
                  className="vg-actor"
                  style={{
                    left: `${point.x * 100}%`,
                    top: `${point.y * 100}%`,
                    transform: `translate(-50%, -38%) scale(${scale})`,
                    zIndex: 3 + Math.round(point.y * 10),
                  }}
                >
                  <div className={hitting ? 'vg-bob is-hit' : 'vg-bob'} style={{ ['--d' as string]: `${index * 0.12}s` }}>
                    <Athlete facing="front" hair={CPU_HAIR[index]} kind={KINDS[index]} jersey="#ff4d4d" shorts="#9d1c1c" />
                  </div>
                </div>
              );
            })}
            {[1, 2, 3, 4, 5, 6].map((zone) => {
              const point = zonePoint(zone);
              const hitting = sim.hitUs === zone && sim.now < sim.hitUsUntil;
              const missing = sim.missZone === zone && sim.now < sim.missUntil;
              const scale = zone <= 3 ? 0.92 : 1.04;
              return (
                <div
                  key={`us-${zone}`}
                  className="vg-actor"
                  style={{
                    left: `${point.x * 100}%`,
                    top: `${point.y * 100}%`,
                    transform: `translate(-50%, -38%) scale(${scale})`,
                    zIndex: 4 + Math.round(point.y * 10),
                  }}
                >
                  <div
                    className={hitting ? 'vg-bob is-hit' : missing ? 'vg-bob is-miss' : 'vg-bob'}
                    style={{ ['--d' as string]: `${zone * 0.1}s` }}
                  >
                    <Athlete
                      facing="back"
                      hair={HAIR[zone - 1]}
                      kind={KINDS[zone - 1]}
                      jersey="#2f6bff"
                      shorts="#163a86"
                      number={keyForZone(zone)}
                    />
                  </div>
                </div>
              );
            })}
            <div className="vg-shadow" style={shadowStyle} />
            <div className="vg-ball" style={ballStyle}>
              <Ball />
            </div>
            {sim.phase === 'toPlayer' && sim.flash && (
              <div
                className="vg-live-no"
                style={{
                  left: `${zonePoint(sim.targetZone).x * 100}%`,
                  top: `${zonePoint(sim.targetZone).y * 100}%`,
                }}
              >
                {keyForZone(sim.targetZone)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="vg-pad-wrap">
        <p className="vg-hint">閃燈再按　·　近網 7 8 9　·　近你 4 5 6</p>
        <div className="vg-pad">
          {[1, 2, 3, 4, 5, 6].map((zone) => {
            const hot = sim.phase === 'toPlayer' && sim.flash && sim.targetZone === zone;
            const down = sim.pressed === zone && sim.now < sim.pressedUntil;
            return (
              <button
                key={zone}
                type="button"
                className={`vg-key${hot ? ' hot' : ''}${down ? ' down' : ''}`}
                onClick={() => onZone(zone)}
              >
                {keyForZone(zone)}
              </button>
            );
          })}
        </div>
      </div>
      </div>

      {(sim.phase === 'menu' || sim.phase === 'gameover') && (
        <div className="vg-overlay">
          {sim.winner === 'us' && (
            <div className="vg-confetti" aria-hidden="true">
              {CONFETTI.concat(CONFETTI, CONFETTI).map((color, i) => (
                <i
                  key={i}
                  style={{
                    left: `${(i * 17) % 100}%`,
                    background: color,
                    animationDelay: `${(i % 8) * 0.08}s`,
                  }}
                />
              ))}
            </div>
          )}
          <div className="vg-card">
            {sim.phase === 'menu' ? (
              <>
                <h1>鳥瞰排球</h1>
                <p>從上方俯瞰。遠處是電腦隊，近處六位球員各守一格，不用跑位。</p>
                <div className="vg-mini" aria-hidden="true">
                  {[1, 2, 3, 4, 5, 6].map((n) => <div key={n}>{keyForZone(n)}</div>)}
                </div>
                <p>球過網後，落下的那一格會閃燈。近網按 7 8 9，近你按 4 5 6，或直接點那一格。</p>
                <p>回擊得 1 分。按錯或漏接，電腦得 1 分。先到 {WIN_SCORE} 分獲勝。</p>
              </>
            ) : (
              <>
                <h1>{sim.winner === 'us' ? '你贏了！' : '電腦贏了'}</h1>
                <p>我方 {sim.score} ： {sim.cpuScore} 電腦</p>
                <p>本局最高連擊 {sim.maxCombo}　·　歷史最高分 {sim.best}</p>
              </>
            )}
            <button type="button" className="vg-start" onClick={start}>
              {sim.phase === 'menu' ? '開始比賽' : '再來一局'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
