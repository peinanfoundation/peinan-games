export const BITE_MIN = 3;
export const BITE_MAX = 6;
export const BITE_WINDOW = 1.35;
export const TUG_SECONDS = 10;

export const GAUGE_STOPS = [
  { zone: 'red' as const, at: 0.18 },
  { zone: 'yellow' as const, at: 0.34 },
  { zone: 'green' as const, at: 0.66 },
  { zone: 'yellow' as const, at: 0.82 },
  { zone: 'red' as const, at: 1 },
];

export type Zone = 'red' | 'yellow' | 'green';
export type Dir = -1 | 1;

export interface FishKind {
  id: string;
  name: string;
  species: string;
  points: number;
  note: string;
  body: string;
  fin: string;
  belly: string;
  accent: string;
  period: number;
  dart: number;
  safeHalf: number;
  slipLimit: number;
}

export const FISHES: FishKind[] = [
  {
    id: 'crucian',
    name: '鯽魚',
    species: '銀鯽',
    points: 10,
    note: '河面最常見',
    body: '#d5dde4',
    fin: '#8b98a6',
    belly: '#f4f7f8',
    accent: '#6d7b88',
    period: 1.75,
    dart: 0.85,
    safeHalf: 0.46,
    slipLimit: 1.15,
  },
  {
    id: 'carp',
    name: '鯉魚',
    species: '鯉魚',
    points: 20,
    note: '會穩穩地拉',
    body: '#e3a23d',
    fin: '#c56b22',
    belly: '#f6d7a2',
    accent: '#a85a18',
    period: 1.5,
    dart: 1.15,
    safeHalf: 0.4,
    slipLimit: 0.95,
  },
  {
    id: 'catfish',
    name: '鯰魚',
    species: '東亞鯰',
    points: 35,
    note: '忽然猛衝',
    body: '#61707a',
    fin: '#3d4b54',
    belly: '#c5d0d6',
    accent: '#1d2a30',
    period: 1.32,
    dart: 1.5,
    safeHalf: 0.34,
    slipLimit: 0.8,
  },
  {
    id: 'bass',
    name: '鱸魚',
    species: '大口黑鱸',
    points: 50,
    note: '左右亂竄',
    body: '#3f9460',
    fin: '#1f6a40',
    belly: '#d7ecd4',
    accent: '#143d28',
    period: 1.16,
    dart: 1.9,
    safeHalf: 0.28,
    slipLimit: 0.68,
  },
  {
    id: 'arowana',
    name: '金龍魚',
    species: '亞洲龍魚',
    points: 80,
    note: '深水才遇得到',
    body: '#f0b52e',
    fin: '#d94b3a',
    belly: '#ffe6a8',
    accent: '#8c2f24',
    period: 1.02,
    dart: 2.35,
    safeHalf: 0.22,
    slipLimit: 0.55,
  },
  {
    id: 'seabream',
    name: '烏頭',
    species: '黑棘鯛',
    points: 45,
    note: '岸邊會碰到',
    body: '#b7c0c6',
    fin: '#4d565c',
    belly: '#e7ecee',
    accent: '#1c2428',
    period: 1.38,
    dart: 1.35,
    safeHalf: 0.36,
    slipLimit: 0.88,
  },
  {
    id: 'grouper',
    name: '石斑',
    species: '點帶石斑',
    points: 90,
    note: '往石縫裡鑽',
    body: '#c4783a',
    fin: '#8a4e24',
    belly: '#f0d2b0',
    accent: '#5c3214',
    period: 1.18,
    dart: 1.75,
    safeHalf: 0.3,
    slipLimit: 0.7,
  },
  {
    id: 'lantern',
    name: '燈籠魚',
    species: '黑角鮟鱇',
    points: 110,
    note: '頭上掛著釣燈',
    body: '#2a211c',
    fin: '#3d322c',
    belly: '#5a463c',
    accent: '#f3e2a0',
    period: 1.08,
    dart: 2.05,
    safeHalf: 0.24,
    slipLimit: 0.6,
  },
  {
    id: 'shark',
    name: '鯊魚',
    species: '灰礁鯊',
    points: 150,
    note: '整條河都會動',
    body: '#8d98a0',
    fin: '#5c6870',
    belly: '#d5dde2',
    accent: '#2c353b',
    period: 0.9,
    dart: 2.55,
    safeHalf: 0.18,
    slipLimit: 0.48,
  },
  {
    id: 'piranha',
    name: '食人魚',
    species: '紅腹食人魚',
    points: -30,
    note: '釣上來會扣分',
    body: '#d23b3b',
    fin: '#8e1e24',
    belly: '#f4b4a8',
    accent: '#5c1218',
    period: 1.22,
    dart: 1.55,
    safeHalf: 0.32,
    slipLimit: 0.78,
  },
];

export const TIER_NAMES = ['平靜河面', '水波變大', '魚開始猛拉', '急流', '深水'];

const PULL_RATE = 3.6;
const WRONG_RATE = 2.8;

export interface Award {
  base: number;
  perfect: number;
  steady: number;
  total: number;
}

export interface TugState {
  x: number;
  v: number;
  intent: Dir;
  intentTimer: number;
  slip: number;
  slipTime: number;
  elapsed: number;
  escaped: boolean;
  caught: boolean;
}

export function tierOf(catches: number): number {
  return Math.min(TIER_NAMES.length - 1, Math.floor(Math.max(0, catches) / 2));
}

export function nextFishIndex(catches: number): number {
  if (FISHES.length === 0) return 0;
  return Math.max(0, Math.floor(catches)) % FISHES.length;
}

export function fishPool(catches: number): FishKind[] {
  const n = Math.max(0, Math.floor(catches));
  if (n >= FISHES.length) return FISHES.slice();
  return FISHES.slice(0, n + 1);
}

export function pickFish(catches: number, _rng?: () => number): FishKind {
  return FISHES[nextFishIndex(catches)];
}

export function rollBiteDelay(rng: () => number): number {
  return BITE_MIN + rng() * (BITE_MAX - BITE_MIN);
}

export function zoneAt(marker: number): Zone {
  const x = Math.min(1, Math.max(0, marker));
  for (const stop of GAUGE_STOPS) {
    if (x <= stop.at) return stop.zone;
  }
  return 'red';
}

export function gaugeMarker(elapsed: number, period: number): number {
  const span = period <= 0 ? 1 : period;
  const u = ((elapsed % span) + span) % span / span;
  return u < 0.5 ? u * 2 : 2 - u * 2;
}

export function counterKeys(intent: Dir): { left: boolean; right: boolean } {
  return intent > 0 ? { left: true, right: false } : { left: false, right: true };
}

export function counterHint(intent: Dir): string {
  return intent > 0 ? '魚往右逃，按 ←' : '魚往左逃，按 →';
}

export function createTug(intent: Dir): TugState {
  return {
    x: 0,
    v: 0,
    intent,
    intentTimer: 0.85,
    slip: 0,
    slipTime: 0,
    elapsed: 0,
    escaped: false,
    caught: false,
  };
}

export function stepTug(
  state: TugState,
  fish: FishKind,
  input: { left: boolean; right: boolean; dt: number },
  rng: () => number,
): TugState {
  if (state.caught || state.escaped) return state;
  const dt = Math.min(0.05, Math.max(0, input.dt));
  let intent = state.intent;
  let intentTimer = state.intentTimer - dt;
  if (intentTimer <= 0) {
    intent = rng() < 0.65 ? (intent === 1 ? -1 : 1) : intent;
    intentTimer = 0.7 + rng() * 0.8;
  }

  const counter = (intent > 0 && input.left && !input.right) || (intent < 0 && input.right && !input.left);
  const wrong = (intent > 0 && input.right && !input.left) || (intent < 0 && input.left && !input.right);
  let desired = intent * 1.05;
  let rate = fish.dart;
  if (counter) {
    desired = 0;
    rate = PULL_RATE;
  } else if (wrong) {
    desired = intent * 1.25;
    rate = WRONG_RATE;
  }
  const follow = 1 - Math.exp(-rate * dt);
  const x = Math.min(1.15, Math.max(-1.15, state.x + (desired - state.x) * follow));
  const v = dt > 0 ? (x - state.x) / dt : 0;
  const outside = Math.abs(x) > fish.safeHalf;
  const slip = Math.max(0, state.slip + (outside ? dt : -dt * 1.7));
  const escaped = slip >= fish.slipLimit;
  const elapsed = state.elapsed + dt;
  return {
    x,
    v,
    intent,
    intentTimer,
    slip,
    slipTime: state.slipTime + (outside ? dt : 0),
    elapsed,
    escaped,
    caught: !escaped && elapsed >= TUG_SECONDS,
  };
}

export function scoreCatch(fish: FishKind, marker: number, slipTime: number): Award {
  if (fish.points < 0) return { base: fish.points, perfect: 0, steady: 0, total: fish.points };
  const perfect = Math.abs(marker - 0.5) <= 0.06 ? Math.round(fish.points * 0.5) : 0;
  const steady = slipTime < 0.35 ? Math.round(fish.points * 0.25) : 0;
  return { base: fish.points, perfect, steady, total: fish.points + perfect + steady };
}
