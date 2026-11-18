export const CARD_COUNT = 20;

export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const swap = next[i]!;
    next[i] = next[j]!;
    next[j] = swap;
  }
  return next;
}

export function dealCards(recipeIds: readonly string[], poolIds: readonly string[], rng: () => number) {
  if (new Set(recipeIds).size !== recipeIds.length) {
    throw new Error('recipe has duplicate ingredients');
  }
  const paired = recipeIds.flatMap((id) => [id, id]);
  const fillersNeeded = CARD_COUNT - paired.length;
  const pool = poolIds.filter((id) => !recipeIds.includes(id));
  if (pool.length < fillersNeeded) throw new Error('not enough other ingredients');
  const fillers = shuffle(pool, rng).slice(0, fillersNeeded);
  return shuffle([...paired, ...fillers], rng);
}

/** Shared duel deck: both recipes' ingredients appear as pairs; filler fills the rest. */
export function dealDuelCards(
  recipeA: readonly string[],
  recipeB: readonly string[],
  poolIds: readonly string[],
  rng: () => number,
) {
  const needed = [...new Set([...recipeA, ...recipeB])];
  const paired = needed.flatMap((id) => [id, id]);
  if (paired.length > CARD_COUNT) throw new Error('duel recipes need too many cards');
  const fillersNeeded = CARD_COUNT - paired.length;
  const pool = poolIds.filter((id) => !needed.includes(id));
  if (pool.length < fillersNeeded) throw new Error('not enough other ingredients');
  const fillers = shuffle(pool, rng).slice(0, fillersNeeded);
  return shuffle([...paired, ...fillers], rng);
}

export function pickDuelRecipes<T extends { id: string; ingredientIds: readonly string[] }>(
  recipes: readonly T[],
  rng: () => number,
): [T, T] {
  if (recipes.length < 2) throw new Error('need at least two recipes');
  const first = recipes[Math.floor(rng() * recipes.length)]!;
  const peers = recipes.filter(
    (item) => item.id !== first.id && item.ingredientIds.length === first.ingredientIds.length,
  );
  if (peers.length === 0) throw new Error('no peer recipe with the same ingredient count');
  const second = peers[Math.floor(rng() * peers.length)]!;
  return [first, second];
}

export interface Round {
  recipeIds: string[];
  cards: string[];
  found: string[];
  mistakes: number;
  removed: number[];
  open: number[];
}

export type RoundPhase = 'play' | 'won';
export type PairOutcome = 'ignore' | 'open' | 'match';

export interface RevealResult {
  round: Round;
  outcome: PairOutcome;
  phase: RoundPhase;
  matched: number[];
  closed: number | null;
}

export function formatElapsed(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function phaseOf(round: Round): RoundPhase {
  if (round.recipeIds.length > 0 && round.recipeIds.every((id) => round.found.includes(id))) return 'won';
  return 'play';
}

export function revealPair(round: Round, index: number): RevealResult {
  const phase = phaseOf(round);
  const none: RevealResult = { round, outcome: 'ignore', phase, matched: [], closed: null };
  if (
    index < 0 ||
    index >= round.cards.length ||
    round.removed.includes(index) ||
    round.open.includes(index) ||
    phase !== 'play'
  ) {
    return none;
  }
  if (round.open.length === 0) {
    return { round: { ...round, open: [index] }, outcome: 'open', phase: 'play', matched: [], closed: null };
  }
  const partner = round.open[round.open.length - 1]!;
  const closed = round.open.length === 2 ? round.open[0]! : null;
  const same = round.cards[partner] === round.cards[index];
  if (!same) {
    const next: Round = { ...round, open: [partner, index], mistakes: round.mistakes + 1 };
    return { round: next, outcome: 'open', phase: 'play', matched: [], closed };
  }
  const id = round.cards[index]!;
  const found = round.recipeIds.includes(id) && !round.found.includes(id) ? [...round.found, id] : round.found;
  const next: Round = {
    ...round,
    open: [],
    removed: [...round.removed, partner, index],
    found,
  };
  return { round: next, outcome: 'match', phase: phaseOf(next), matched: [partner, index], closed };
}

/** One seat in online duel: cards stay on the table for the opponent. */
export interface SeatState {
  found: string[];
  mistakes: number;
  cleared: number[];
  open: number[];
  finishedAt: number | null;
}

export interface SeatRevealResult {
  seat: SeatState;
  outcome: PairOutcome;
  phase: RoundPhase;
  matched: number[];
  closed: number | null;
}

export function emptySeat(): SeatState {
  return { found: [], mistakes: 0, cleared: [], open: [], finishedAt: null };
}

export function seatPhase(recipeIds: readonly string[], seat: SeatState): RoundPhase {
  if (recipeIds.length > 0 && recipeIds.every((id) => seat.found.includes(id))) return 'won';
  return 'play';
}

export function revealSeat(
  cards: readonly string[],
  recipeIds: readonly string[],
  seat: SeatState,
  index: number,
): SeatRevealResult {
  const phase = seatPhase(recipeIds, seat);
  const none: SeatRevealResult = { seat, outcome: 'ignore', phase, matched: [], closed: null };
  if (
    index < 0 ||
    index >= cards.length ||
    seat.cleared.includes(index) ||
    seat.open.includes(index) ||
    phase !== 'play'
  ) {
    return none;
  }
  if (seat.open.length === 0) {
    return { seat: { ...seat, open: [index] }, outcome: 'open', phase: 'play', matched: [], closed: null };
  }
  const partner = seat.open[seat.open.length - 1]!;
  const closed = seat.open.length === 2 ? seat.open[0]! : null;
  const id = cards[index]!;
  const same = cards[partner] === id && recipeIds.includes(id);
  if (!same) {
    const next: SeatState = { ...seat, open: [partner, index], mistakes: seat.mistakes + 1 };
    return { seat: next, outcome: 'open', phase: 'play', matched: [], closed };
  }
  const found = !seat.found.includes(id) ? [...seat.found, id] : seat.found;
  const next: SeatState = {
    ...seat,
    open: [],
    cleared: [...seat.cleared, partner, index],
    found,
  };
  return {
    seat: next,
    outcome: 'match',
    phase: seatPhase(recipeIds, next),
    matched: [partner, index],
    closed,
  };
}

export function visibleOpens(seats: readonly SeatState[]): number[] {
  const seen = new Set<number>();
  const list: number[] = [];
  for (const seat of seats) {
    for (const index of seat.open) {
      if (seen.has(index)) continue;
      seen.add(index);
      list.push(index);
    }
  }
  return list;
}

export function openOwners(seats: readonly SeatState[]): Map<number, number[]> {
  const map = new Map<number, number[]>();
  seats.forEach((seat, seatIndex) => {
    for (const index of seat.open) {
      const owners = map.get(index) ?? [];
      owners.push(seatIndex);
      map.set(index, owners);
    }
  });
  return map;
}

export function rngFromSeed(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
