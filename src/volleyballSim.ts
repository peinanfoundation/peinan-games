export const WIN_SCORE = 7;

const BEST_KEY = 'volleyball-best-score';
const COMBO_KEY = 'volleyball-best-combo';

export type Point = { x: number; y: number };
export type Phase = 'menu' | 'toPlayer' | 'toCpu' | 'contact' | 'pause' | 'gameover';
export type Winner = 'us' | 'cpu';

export type Sim = {
  phase: Phase;
  t: number;
  duration: number;
  from: Point;
  to: Point;
  ball: { x: number; y: number; h: number };
  targetZone: number;
  cpuTarget: number;
  resolved: boolean;
  flash: boolean;
  windowMs: number;
  score: number;
  cpuScore: number;
  combo: number;
  maxCombo: number;
  best: number;
  bestCombo: number;
  message: string;
  messageUntil: number;
  hitUs: number;
  hitUsUntil: number;
  hitCpu: number;
  hitCpuUntil: number;
  missZone: number;
  missUntil: number;
  pauseUntil: number;
  contactUntil: number;
  returnStartH: number;
  pendingWin: boolean;
  winner: Winner | null;
  shakeUntil: number;
  now: number;
  rally: number;
  pressed: number;
  pressedUntil: number;
  rng: () => number;
};

function readStored(key: string) {
  try {
    const value = Number(localStorage.getItem(key) || 0);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeStored(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* ignore private mode */
  }
}

/** Player zones, left to right: 1 2 3 near the net, 4 5 6 near the camera. */
export function zonePoint(zone: number): Point {
  const index = zone - 1;
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: (col + 0.5) / 3,
    y: 0.5 + (row + 0.5) / 4,
  };
}

/** Computer court, 0–2 far row, 3–5 the row beside the net. */
export function cpuPoint(index: number): Point {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: (col + 0.5) / 3,
    y: (row + 0.5) / 4,
  };
}

export function flightMs(score: number) {
  return Math.max(780, 1560 - score * 95);
}

/** Zones 1–6 sit on the numpad as 7 8 9 / 4 5 6. */
const ZONE_KEYS = [7, 8, 9, 4, 5, 6];

export function keyForZone(zone: number) {
  return ZONE_KEYS[zone - 1] ?? zone;
}

export function zoneFromKey(key: number) {
  const zone = ZONE_KEYS.indexOf(key);
  return zone === -1 ? null : zone + 1;
}

const FLASH_AT = 0.38;
const FLASH_LEAD_MS = 200;

function flashProgress(duration: number) {
  if (duration <= 0) return 0;
  return Math.max(0, FLASH_AT - FLASH_LEAD_MS / duration);
}

function easeInOut(p: number) {
  return p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
}

function remember(s: Sim) {
  if (s.score > s.best) {
    s.best = s.score;
    writeStored(BEST_KEY, s.best);
  }
  if (s.maxCombo > s.bestCombo) {
    s.bestCombo = s.maxCombo;
    writeStored(COMBO_KEY, s.bestCombo);
  }
}

function launchToPlayer(s: Sim, cpuIndex: number, now: number, announce: boolean) {
  const zone = 1 + Math.floor(s.rng() * 6);
  s.rally += 1;
  s.phase = 'toPlayer';
  s.t = 0;
  s.duration = flightMs(s.score);
  s.from = cpuPoint(cpuIndex);
  s.to = zonePoint(zone);
  s.targetZone = zone;
  s.resolved = false;
  s.flash = false;
  s.windowMs = 0;
  s.hitCpu = cpuIndex;
  s.hitCpuUntil = now + 260;
  s.ball = { x: s.from.x, y: s.from.y, h: 0 };
  if (announce) {
    s.message = '電腦發球';
    s.messageUntil = now + 650;
  }
}

function launchToCpu(s: Sim, from: Point, startH: number) {
  const idx = Math.floor(s.rng() * 6);
  s.cpuTarget = idx;
  s.phase = 'toCpu';
  s.t = 0;
  s.duration = Math.max(640, flightMs(s.score) - 160);
  s.from = { ...from };
  s.to = cpuPoint(idx);
  s.returnStartH = startH;
  s.flash = false;
  s.resolved = true;
}

function miss(s: Sim, now: number, reason: string) {
  if (s.resolved || s.phase !== 'toPlayer') return;
  s.resolved = true;
  s.flash = false;
  s.combo = 0;
  s.cpuScore += 1;
  s.ball.x = s.to.x;
  s.ball.y = s.to.y;
  s.ball.h = 0.22;
  s.missZone = s.targetZone;
  s.missUntil = now + 420;
  s.shakeUntil = now + 280;
  s.pendingWin = false;
  if (s.cpuScore >= WIN_SCORE) {
    s.phase = 'gameover';
    s.winner = 'cpu';
    s.message = '電腦贏了';
    s.messageUntil = now + 4000;
    return;
  }
  s.phase = 'pause';
  s.pauseUntil = now + 880;
  s.message = reason;
  s.messageUntil = now + 800;
}

function arriveCpu(s: Sim, now: number) {
  s.ball.x = s.to.x;
  s.ball.y = s.to.y;
  s.ball.h = 0.08;
  s.hitCpu = s.cpuTarget;
  s.hitCpuUntil = now + 260;
  if (s.pendingWin) {
    s.phase = 'gameover';
    s.winner = 'us';
    s.message = '你贏了！';
    s.messageUntil = now + 4000;
    return;
  }
  s.phase = 'contact';
  s.contactUntil = now + 260;
}

export function createSim(rng: () => number = Math.random): Sim {
  const origin = cpuPoint(1);
  return {
    phase: 'menu',
    t: 0,
    duration: flightMs(0),
    from: origin,
    to: zonePoint(2),
    ball: { x: origin.x, y: origin.y, h: 0.2 },
    targetZone: 2,
    cpuTarget: 1,
    resolved: false,
    flash: false,
    windowMs: 0,
    score: 0,
    cpuScore: 0,
    combo: 0,
    maxCombo: 0,
    best: readStored(BEST_KEY),
    bestCombo: readStored(COMBO_KEY),
    message: '',
    messageUntil: 0,
    hitUs: -1,
    hitUsUntil: 0,
    hitCpu: -1,
    hitCpuUntil: 0,
    missZone: -1,
    missUntil: 0,
    pauseUntil: 0,
    contactUntil: 0,
    returnStartH: 0,
    pendingWin: false,
    winner: null,
    shakeUntil: 0,
    now: 0,
    rally: 0,
    pressed: 0,
    pressedUntil: 0,
    rng,
  };
}

export function beginMatch(s: Sim, now: number) {
  s.score = 0;
  s.cpuScore = 0;
  s.combo = 0;
  s.maxCombo = 0;
  s.pendingWin = false;
  s.winner = null;
  s.resolved = false;
  s.flash = false;
  s.message = '';
  launchToPlayer(s, Math.floor(s.rng() * 6), now, true);
}

export function pressZone(s: Sim, zone: number, now: number) {
  if (s.phase !== 'toPlayer' || s.resolved) return;
  if (zone < 1 || zone > 6) return;
  if (!s.flash) {
    s.message = '等球過來';
    s.messageUntil = now + 420;
    return;
  }
  if (zone !== s.targetZone) {
    miss(s, now, '按錯了');
    return;
  }
  s.resolved = true;
  s.flash = false;
  s.score += 1;
  s.combo += 1;
  s.maxCombo = Math.max(s.maxCombo, s.combo);
  s.hitUs = zone;
  s.hitUsUntil = now + 280;
  s.pendingWin = s.score >= WIN_SCORE;
  s.message = s.pendingWin ? '決勝分！' : s.combo >= 2 ? `連擊 ×${s.combo}！` : '好球！';
  s.messageUntil = now + 720;
  remember(s);
  launchToCpu(s, { x: s.ball.x, y: s.ball.y }, s.ball.h);
}

export function step(s: Sim, now: number, dt: number) {
  s.now = now;
  if (s.phase !== 'gameover' && s.message && now > s.messageUntil) s.message = '';

  if (s.phase === 'menu') {
    const origin = cpuPoint(1);
    s.ball.x = origin.x;
    s.ball.y = origin.y;
    s.ball.h = 0.22 + Math.sin(now / 280) * 0.06;
    return;
  }

  if (s.phase === 'gameover') return;

  if (s.phase === 'pause') {
    s.ball.h = Math.max(0, s.ball.h - dt / 180);
    if (now >= s.pauseUntil) launchToPlayer(s, Math.floor(s.rng() * 6), now, true);
    return;
  }

  if (s.phase === 'contact') {
    if (now >= s.contactUntil) launchToPlayer(s, s.cpuTarget, now, false);
    return;
  }

  if (s.phase !== 'toPlayer' && s.phase !== 'toCpu') return;

  s.t += dt;
  const p = s.duration <= 0 ? 1 : Math.min(1, s.t / s.duration);
  const eased = easeInOut(p);
  s.ball.x = s.from.x + (s.to.x - s.from.x) * eased;
  s.ball.y = s.from.y + (s.to.y - s.from.y) * eased;

  if (s.phase === 'toPlayer') {
    s.ball.h = Math.sin(p * Math.PI);
    if (!s.resolved && p >= flashProgress(s.duration)) {
      if (!s.flash) {
        s.flash = true;
        s.windowMs = Math.max(240, s.duration - s.t);
      }
    } else if (!s.resolved) {
      s.flash = false;
    }
    if (p >= 1 && !s.resolved) miss(s, now, '太慢了');
    return;
  }

  s.ball.h = (1 - p) * s.returnStartH + Math.sin(p * Math.PI) * 0.85;
  s.flash = false;
  if (p >= 1) arriveCpu(s, now);
}
