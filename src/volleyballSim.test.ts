import { describe, expect, it } from 'vitest';
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
} from './volleyballSim';

describe('volleyball court', () => {
  it('numbers the near court 1 2 3 along the net and 4 5 6 toward the player', () => {
    expect(zonePoint(1).x).toBeLessThan(zonePoint(2).x);
    expect(zonePoint(2).x).toBeLessThan(zonePoint(3).x);
    expect(zonePoint(1).y).toBe(zonePoint(2).y);
    expect(zonePoint(1).y).toBeLessThan(zonePoint(4).y);
    expect(zonePoint(4).x).toBeLessThan(zonePoint(5).x);
    expect(zonePoint(6).y).toBeGreaterThan(0.5);
    expect(cpuPoint(0).y).toBeLessThan(0.5);
    expect(cpuPoint(0).y).toBeLessThan(cpuPoint(3).y);
  });

  it('maps the six zones onto numpad keys 7 8 9 / 4 5 6', () => {
    expect([1, 2, 3, 4, 5, 6].map(keyForZone)).toEqual([7, 8, 9, 4, 5, 6]);
    expect(zoneFromKey(7)).toBe(1);
    expect(zoneFromKey(8)).toBe(2);
    expect(zoneFromKey(9)).toBe(3);
    expect(zoneFromKey(1)).toBeNull();
  });
});

describe('volleyball rally', () => {
  function scripted() {
    return createSim(() => 0);
  }

  it('scores a return and sends the ball back to the computer', () => {
    const sim = scripted();
    beginMatch(sim, 0);
    expect(sim.phase).toBe('toPlayer');
    expect(sim.flash).toBe(false);
    expect(sim.targetZone).toBe(1);

    const startY = sim.ball.y;
    step(sim, 100, sim.duration / 2);
    expect(sim.flash).toBe(true);
    expect(sim.ball.y).toBeGreaterThan(startY);
    expect(sim.ball.h).toBeGreaterThan(0.9);

    pressZone(sim, 1, 120);
    expect(sim.score).toBe(1);
    expect(sim.combo).toBe(1);
    expect(sim.phase).toBe('toCpu');
    expect(sim.message).toBe('好球！');
    expect(sim.to.y).toBeLessThan(0.5);
  });

  it('starts the landing light 0.2 seconds earlier', () => {
    const sim = scripted();
    beginMatch(sim, 0);
    const oldStart = sim.duration * 0.38;
    step(sim, 10, oldStart - 200 - 40);
    expect(sim.flash).toBe(false);
    step(sim, 20, 80);
    expect(sim.flash).toBe(true);
  });

  it('gives the computer a point on the wrong key or a late press', () => {
    const wrong = scripted();
    beginMatch(wrong, 0);
    step(wrong, 20, wrong.duration * 0.5);
    pressZone(wrong, 4, 40);
    expect(wrong.cpuScore).toBe(1);
    expect(wrong.score).toBe(0);
    expect(wrong.phase).toBe('pause');
    expect(wrong.message).toBe('按錯了');

    const late = scripted();
    beginMatch(late, 0);
    step(late, 50, late.duration);
    expect(late.cpuScore).toBe(1);
    expect(late.phase).toBe('pause');
    expect(late.message).toBe('太慢了');
  });

  it('ignores keys while the ball is traveling back', () => {
    const sim = scripted();
    beginMatch(sim, 0);
    pressZone(sim, 1, 5);
    expect(sim.score).toBe(0);
    expect(sim.message).toBe('等球過來');
    step(sim, 10, sim.duration * 0.5);
    pressZone(sim, 1, 10);
    pressZone(sim, 1, 20);
    expect(sim.score).toBe(1);
    expect(sim.phase).toBe('toCpu');
  });

  it('ends the match when either side reaches the winning score', () => {
    const win = scripted();
    beginMatch(win, 0);
    let now = 0;
    for (let i = 0; i < WIN_SCORE; i += 1) {
      expect(win.phase).toBe('toPlayer');
      now += 20;
      step(win, now, win.duration * 0.5);
      pressZone(win, win.targetZone, now);
      now += 30;
      step(win, now, win.duration + 5);
      if (i === WIN_SCORE - 1) {
        expect(win.phase).toBe('gameover');
        expect(win.winner).toBe('us');
        expect(win.score).toBe(WIN_SCORE);
      } else {
        expect(win.phase).toBe('contact');
        now += 400;
        step(win, now, 16);
      }
    }

    const lose = scripted();
    beginMatch(lose, 0);
    now = 0;
    for (let i = 0; i < WIN_SCORE; i += 1) {
      expect(lose.phase).toBe('toPlayer');
      const wrongZone = lose.targetZone === 1 ? 2 : 1;
      now += 20;
      step(lose, now, lose.duration * 0.5);
      pressZone(lose, wrongZone, now);
      if (i === WIN_SCORE - 1) {
        expect(lose.phase).toBe('gameover');
        expect(lose.winner).toBe('cpu');
      } else {
        expect(lose.phase).toBe('pause');
        now += 1000;
        step(lose, now, 16);
      }
    }
  });
});
