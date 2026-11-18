import {
  BITE_WINDOW,
  counterHint,
  createTug,
  gaugeMarker,
  pickFish,
  rollBiteDelay,
  scoreCatch,
  stepTug,
  tierOf,
  TIER_NAMES,
  zoneAt,
  type Award,
  type FishKind,
  type TugState,
} from './logic';

export type Mode = 'title' | 'wait' | 'bite' | 'gauge' | 'tug' | 'lift' | 'miss';

export interface Sim {
  mode: Mode;
  modeTime: number;
  biteDelay: number;
  score: number;
  streak: number;
  catches: number;
  seen: string[];
  fish: FishKind | null;
  marker: number;
  tug: TugState | null;
  message: string;
  detail: string;
  shake: number;
  award: Award | null;
  repeat: boolean;
}

export interface Hold {
  left: boolean;
  right: boolean;
}

export function createSim(): Sim {
  return {
    mode: 'title',
    modeTime: 0,
    biteDelay: 0,
    score: 0,
    streak: 0,
    catches: 0,
    seen: [],
    fish: null,
    marker: 0,
    tug: null,
    message: '釣魚',
    detail: '坐在小船上',
    shake: 0,
    award: null,
    repeat: false,
  };
}

export function stepIndex(mode: Mode): number {
  if (mode === 'gauge') return 2;
  if (mode === 'tug') return 3;
  if (mode === 'lift') return 4;
  return 1;
}

export function pressSpace(sim: Sim, rng: () => number): Sim {
  if (sim.mode === 'title') return enterWait(sim, rng, false);
  if (sim.mode === 'wait') {
    if (sim.modeTime < 0.4) return sim;
    return {
      ...sim,
      modeTime: 0,
      biteDelay: rollBiteDelay(rng),
      message: '太早了',
      detail: '魚還沒上釣，魚線還在左右擺',
      shake: 6,
    };
  }
  if (sim.mode === 'bite') {
    const fish = pickFish(sim.catches, rng);
    const repeat = sim.seen.includes(fish.id);
    return {
      ...sim,
      mode: 'gauge',
      modeTime: 0,
      fish,
      marker: 0,
      tug: null,
      award: null,
      repeat,
      message: `${fish.species}上鉤了`,
      detail: repeat ? '這條釣過了，按 ↓ 跳過，或停在綠色中間' : '按空白鍵，把標記停在綠色中間',
      shake: 0,
    };
  }
  if (sim.mode === 'gauge' && sim.fish) {
    const zone = zoneAt(sim.marker);
    if (zone !== 'green') {
      const message = zone === 'red' ? '停到紅區，魚走了' : '沒停在中間，魚走了';
      return enterMiss(sim, message, '回到等魚上釣');
    }
    const intent = rng() < 0.5 ? -1 : 1;
    return {
      ...sim,
      mode: 'tug',
      modeTime: 0,
      tug: createTug(intent),
      message: '拉扯',
      detail: counterHint(intent),
    };
  }
  if (sim.mode === 'lift' || sim.mode === 'miss') return enterWait(sim, rng, sim.mode === 'lift');
  return sim;
}

export function skipCatch(sim: Sim, rng: () => number): Sim {
  if (!sim.repeat) return sim;
  if (sim.mode !== 'gauge' && sim.mode !== 'tug' && sim.mode !== 'lift') return sim;
  return enterWait(sim, rng, sim.mode === 'lift');
}

export function tick(sim: Sim, rawDt: number, input: Hold, rng: () => number): Sim {
  const dt = Math.min(0.05, Math.max(0, rawDt));
  const next: Sim = {
    ...sim,
    modeTime: sim.modeTime + dt,
    shake: sim.shake * Math.exp(-3.5 * dt),
  };

  if (next.mode === 'wait' && next.modeTime >= next.biteDelay) return enterBite(next);
  if (next.mode === 'bite' && next.modeTime >= BITE_WINDOW) {
    return enterMiss(next, '太慢了，魚走了', '回到等魚上釣');
  }
  if (next.mode === 'gauge' && next.fish) {
    return { ...next, marker: gaugeMarker(next.modeTime, next.fish.period) };
  }
  if (next.mode === 'tug' && next.tug && next.fish) {
    const tug = stepTug(next.tug, next.fish, { left: input.left, right: input.right, dt }, rng);
    if (tug.escaped) return enterMiss({ ...next, tug }, '魚走失了', '拉扯不足，回到等魚上釣');
    if (tug.caught) return enterLift({ ...next, tug });
    return { ...next, tug, detail: counterHint(tug.intent) };
  }
  if (next.mode === 'lift' && next.modeTime >= 3.2) return enterWait(next, rng, true);
  if (next.mode === 'miss' && next.modeTime >= 1.35) return enterWait(next, rng, false);
  return next;
}

function enterWait(sim: Sim, rng: () => number, announce: boolean): Sim {
  const tier = tierOf(sim.catches);
  const unlocked = announce && sim.catches > 0 && tier > tierOf(sim.catches - 1);
  return {
    ...sim,
    mode: 'wait',
    modeTime: 0,
    biteDelay: rollBiteDelay(rng),
    fish: null,
    tug: null,
    marker: 0,
    award: null,
    repeat: false,
    message: '等魚上釣',
    detail: unlocked ? `${TIER_NAMES[tier]}，更大的魚會出現` : '魚線左右擺，上釣再按空白鍵',
    shake: 0,
  };
}

function enterBite(sim: Sim): Sim {
  return {
    ...sim,
    mode: 'bite',
    modeTime: 0,
    message: '上釣了！',
    detail: '快按空白鍵',
    shake: 5,
  };
}

function enterMiss(sim: Sim, message: string, detail: string): Sim {
  return {
    ...sim,
    mode: 'miss',
    modeTime: 0,
    streak: 0,
    message,
    detail,
    shake: 10,
    award: null,
  };
}

function enterLift(sim: Sim): Sim {
  const fish = sim.fish;
  if (!fish) return enterMiss(sim, '魚走失了', '回到等魚上釣');
  const award = scoreCatch(fish, sim.marker, sim.tug?.slipTime ?? 0);
  const penalty = award.total < 0;
  return {
    ...sim,
    mode: 'lift',
    modeTime: 0,
    score: sim.score + award.total,
    streak: penalty ? 0 : sim.streak + 1,
    catches: sim.catches + 1,
    seen: sim.seen.includes(fish.id) ? sim.seen : [...sim.seen, fish.id],
    award,
    message: `釣到${fish.species}`,
    detail: penalty ? '這條會扣分，連續中斷' : sim.repeat ? '這條釣過了，按 ↓ 跳過' : '提起來慶祝，接著繼續',
    shake: 0,
  };
}
