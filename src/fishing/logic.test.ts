import { describe, expect, it } from 'vitest';
import { createSim, pressSpace, skipCatch, tick, type Hold, type Sim } from './flow';
import {
  BITE_MAX,
  BITE_MIN,
  BITE_WINDOW,
  FISHES,
  TUG_SECONDS,
  counterHint,
  counterKeys,
  fishPool,
  gaugeMarker,
  nextFishIndex,
  pickFish,
  rollBiteDelay,
  scoreCatch,
  stepTug,
  zoneAt,
  createTug,
} from './logic';

const still: Hold = { left: false, right: false };
const zero = () => 0;

function waitReady(): Sim {
  return pressSpace(createSim(), zero);
}

function advance(sim: Sim, seconds: number, input: Hold = still, rng: () => number = zero): Sim {
  let left = seconds;
  while (left > 1e-8) {
    const dt = Math.min(1 / 60, left);
    sim = tick(sim, dt, input, rng);
    left -= dt;
  }
  return sim;
}

describe('bite and gauge', () => {
  it('waits between 3 and 6 seconds, then asks for space', () => {
    expect(rollBiteDelay(zero)).toBe(BITE_MIN);
    expect(rollBiteDelay(() => 1)).toBe(BITE_MAX);
    let sim = waitReady();
    expect(sim.mode).toBe('wait');
    expect(sim.biteDelay).toBeGreaterThanOrEqual(3);
    expect(sim.biteDelay).toBeLessThanOrEqual(6);
    sim = advance(sim, sim.biteDelay - 0.05);
    expect(sim.mode).toBe('wait');
    sim = advance(sim, 0.1);
    expect(sim.mode).toBe('bite');
    expect(sim.message).toContain('上釣');
  });

  it('ignores the extra tap right after casting', () => {
    let sim = waitReady();
    sim = advance(sim, 0.15);
    sim = pressSpace(sim, zero);
    expect(sim.mode).toBe('wait');
    expect(sim.message).not.toContain('太早');
  });

  it('sends an early press back to waiting', () => {
    let sim = waitReady();
    sim = advance(sim, 2);
    sim = pressSpace(sim, zero);
    expect(sim.mode).toBe('wait');
    expect(sim.modeTime).toBe(0);
    expect(sim.message).toContain('太早');
    sim = advance(sim, 2.9);
    expect(sim.mode).toBe('wait');
  });

  it('loses the fish if space comes too late', () => {
    let sim = waitReady();
    sim = advance(sim, sim.biteDelay + 0.02);
    sim = advance(sim, BITE_WINDOW + 0.02);
    expect(sim.mode).toBe('miss');
    sim = advance(sim, 1.4);
    expect(sim.mode).toBe('wait');
    expect(sim.fish).toBeNull();
  });

  it('only continues when the marker stops in the green middle', () => {
    expect(zoneAt(0)).toBe('red');
    expect(zoneAt(0.25)).toBe('yellow');
    expect(zoneAt(0.5)).toBe('green');
    expect(zoneAt(0.75)).toBe('yellow');
    expect(zoneAt(1)).toBe('red');

    let sim = hooked();
    expect(zoneAt(sim.marker)).toBe('red');
    const missed = pressSpace(sim, zero);
    expect(missed.mode).toBe('miss');
    expect(missed.streak).toBe(0);

    sim = hooked();
    sim = advance(sim, sim.fish!.period / 4);
    expect(zoneAt(sim.marker)).toBe('green');
    sim = pressSpace(sim, zero);
    expect(sim.mode).toBe('tug');
    expect(sim.tug).not.toBeNull();
  });
});

describe('tug of war', () => {
  it('lasts 10 seconds and asks for the opposite direction', () => {
    expect(TUG_SECONDS).toBe(10);
    expect(counterKeys(1)).toEqual({ left: true, right: false });
    expect(counterKeys(-1)).toEqual({ left: false, right: true });
    expect(counterHint(1)).toContain('←');
    expect(counterHint(-1)).toContain('→');

    const fish = FISHES[0];
    let tug = createTug(1);
    let time = 0;
    while (!tug.caught && !tug.escaped && time < 12) {
      const keys = counterKeys(tug.intent);
      tug = stepTug(tug, fish, { ...keys, dt: 1 / 60 }, () => 0.4);
      time += 1 / 60;
    }
    expect(tug.caught).toBe(true);
    expect(tug.elapsed).toBeGreaterThanOrEqual(10);
  });

  it('lets the fish go when the pull is too weak or the wrong way', () => {
    const fish = FISHES[4];
    let idle = createTug(1);
    let wrong = createTug(1);
    let idleTime = 0;
    let wrongTime = 0;
    while (!idle.escaped && idleTime < 8) {
      idle = stepTug(idle, fish, { left: false, right: false, dt: 1 / 60 }, () => 0.2);
      idleTime += 1 / 60;
    }
    while (!wrong.escaped && wrongTime < 8) {
      const keys = counterKeys(wrong.intent);
      wrong = stepTug(wrong, fish, { left: !keys.left, right: !keys.right, dt: 1 / 60 }, () => 0.2);
      wrongTime += 1 / 60;
    }
    expect(idle.escaped).toBe(true);
    expect(wrong.escaped).toBe(true);
    expect(wrongTime).toBeLessThan(idleTime);
  });

  it('celebrates a catch and then keeps fishing', () => {
    let sim = hooked();
    sim = advance(sim, sim.fish!.period / 4);
    sim = pressSpace(sim, zero);
    let guard = 0;
    while (sim.mode === 'tug' && guard < 900) {
      const keys = counterKeys(sim.tug!.intent);
      sim = tick(sim, 1 / 60, keys, () => 0.4);
      guard += 1;
    }
    expect(sim.mode).toBe('lift');
    expect(sim.message).toContain('釣到');
    expect(sim.catches).toBe(1);
    expect(sim.seen).toEqual(['crucian']);
    expect(sim.streak).toBe(1);
    expect(sim.award?.total).toBe(sim.score);
    const score = sim.score;
    sim = advance(sim, 3.3);
    expect(sim.mode).toBe('wait');
    expect(sim.score).toBe(score);

    sim = advance(sim, sim.biteDelay + 0.02);
    sim = pressSpace(sim, zero);
    sim = pressSpace(sim, zero);
    expect(sim.mode).toBe('miss');
    expect(sim.score).toBe(score);
    expect(sim.streak).toBe(0);
  });

  it('lets a repeat catch be skipped without changing the score', () => {
    let sim = hooked();
    expect(sim.repeat).toBe(false);
    expect(skipCatch(sim, zero).mode).toBe('gauge');

    sim = advance(sim, sim.fish!.period / 4);
    sim = pressSpace(sim, zero);
    let guard = 0;
    while (sim.mode === 'tug' && guard < 900) {
      const keys = counterKeys(sim.tug!.intent);
      sim = tick(sim, 1 / 60, keys, () => 0.4);
      guard += 1;
    }
    const score = sim.score;
    sim = advance(sim, 3.3);
    expect(sim.mode).toBe('wait');

    sim = {
      ...sim,
      catches: FISHES.length,
      seen: FISHES.map((fish) => fish.id),
      score,
    };
    sim = advance(sim, sim.biteDelay + 0.02);
    sim = pressSpace(sim, zero);
    expect(sim.fish?.id).toBe('crucian');
    expect(sim.repeat).toBe(true);
    sim = skipCatch(sim, zero);
    expect(sim.mode).toBe('wait');
    expect(sim.score).toBe(score);
    expect(sim.catches).toBe(FISHES.length);
    expect(sim.repeat).toBe(false);
  });
});

describe('fish layers', () => {
  it('follows the difficulty order by catch count', () => {
    expect(FISHES.map((fish) => fish.id)).toEqual([
      'crucian',
      'carp',
      'catfish',
      'bass',
      'arowana',
      'seabream',
      'grouper',
      'lantern',
      'shark',
      'piranha',
    ]);
    expect(fishPool(0).map((fish) => fish.id)).toEqual(['crucian']);
    expect(fishPool(3).map((fish) => fish.id)).toEqual(['crucian', 'carp', 'catfish', 'bass']);
    expect(fishPool(9).map((fish) => fish.id)).toEqual(FISHES.map((fish) => fish.id));
    expect(fishPool(13).map((fish) => fish.id)).toEqual(FISHES.map((fish) => fish.id));
    expect(nextFishIndex(0)).toBe(0);
    expect(nextFishIndex(4)).toBe(4);
    expect(nextFishIndex(9)).toBe(9);
    expect(nextFishIndex(10)).toBe(0);
    expect(pickFish(0).id).toBe('crucian');
    expect(pickFish(1).id).toBe('carp');
    expect(pickFish(4).id).toBe('arowana');
    expect(pickFish(5).id).toBe('seabream');
    expect(pickFish(9).id).toBe('piranha');
    expect(pickFish(10).id).toBe('crucian');
    const piranha = FISHES.find((fish) => fish.id === 'piranha');
    expect(piranha?.points).toBeLessThan(0);
    expect(scoreCatch(piranha!, 0.5, 0)).toEqual({ base: -30, perfect: 0, steady: 0, total: -30 });
  });

  it('moves the gauge back and forth', () => {
    const period = 1.6;
    expect(gaugeMarker(0, period)).toBe(0);
    expect(gaugeMarker(period / 2, period)).toBeCloseTo(1);
    expect(gaugeMarker(period / 4, period)).toBeCloseTo(0.5);
    expect(gaugeMarker(period, period)).toBeCloseTo(0);
  });
});

function hooked(): Sim {
  let sim = waitReady();
  sim = advance(sim, sim.biteDelay + 0.02);
  return pressSpace(sim, zero);
}
