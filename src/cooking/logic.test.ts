import { describe, expect, it } from 'vitest';
import { DISH_ART_IDS } from './dishArt';
import { ALL_INGREDIENT_IDS, INGREDIENTS, RECIPES, ingredientById, recipeById } from './ingredients';
import { HOME, slotPosition } from './layout';
import {
  CARD_COUNT,
  dealCards,
  dealDuelCards,
  emptySeat,
  formatElapsed,
  openOwners,
  phaseOf,
  pickDuelRecipes,
  revealPair,
  revealSeat,
  visibleOpens,
  type Round,
} from './logic';

function rngFrom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function fresh(cards: string[], recipeIds: string[]): Round {
  return { cards, recipeIds, found: [], mistakes: 0, removed: [], open: [] };
}

describe('recipes', () => {
  it('matches the original dishes and their ingredients', () => {
    const names = (id: string) => recipeById(id).ingredientIds.map((item) => ingredientById(item).name);
    expect(names('pork-rice')).toEqual(['番茄', '豬扒', '芝士', '飯']);
    expect(names('spam-noodle')).toEqual(['蛋', '麵', '午餐肉']);
    expect(names('pizza')).toEqual(['麵餅', '茄汁', '芝士', '辣肉腸', '菠蘿']);
  });

  it('keeps every dish to at most five known ingredients and a full deck', () => {
    expect(new Set(INGREDIENTS.map((item) => item.id)).size).toBe(INGREDIENTS.length);
    expect(new Set(RECIPES.map((item) => item.id)).size).toBe(RECIPES.length);
    expect(RECIPES.length).toBeGreaterThanOrEqual(50);
    expect(new Set(DISH_ART_IDS)).toEqual(new Set(RECIPES.map((recipe) => recipe.id)));
    for (const recipe of RECIPES) {
      expect(recipe.ingredientIds.length).toBeGreaterThan(0);
      expect(recipe.ingredientIds.length).toBeLessThanOrEqual(5);
      expect(new Set(recipe.ingredientIds).size).toBe(recipe.ingredientIds.length);
      const others = ALL_INGREDIENT_IDS.filter((id) => !recipe.ingredientIds.includes(id));
      expect(others.length).toBeGreaterThanOrEqual(CARD_COUNT - recipe.ingredientIds.length * 2);
      for (const id of recipe.ingredientIds) ingredientById(id);
    }
  });
});

describe('deal', () => {
  it('puts each needed ingredient on two cards and fills the rest with singles', () => {
    for (const recipe of RECIPES) {
      const cards = dealCards(recipe.ingredientIds, ALL_INGREDIENT_IDS, rngFrom(7));
      expect(cards).toHaveLength(20);
      for (const id of recipe.ingredientIds) {
        expect(cards.filter((card) => card === id)).toHaveLength(2);
      }
      const decoys = cards.filter((card) => !recipe.ingredientIds.includes(card));
      expect(new Set(decoys).size).toBe(decoys.length);
      for (const id of cards) ingredientById(id);
    }
  });
});

describe('pairs', () => {
  const cards = [
    'egg', 'egg', 'onion', 'noodle', 'noodle',
    'spam', 'spam', 'fish', 'milk', 'rice',
    'garlic', 'butter', 'potato', 'ham', 'peas',
    'beef', 'tofu', 'corn', 'shrimp', 'cabbage',
  ];

  it('keeps the first card open and leaves a mismatch open for the next link', () => {
    const first = revealPair(fresh(cards, ['egg', 'noodle', 'spam']), 0);
    expect(first.outcome).toBe('open');
    expect(first.round.open).toEqual([0]);
    expect(first.closed).toBeNull();
    const miss = revealPair(first.round, 2);
    expect(miss.outcome).toBe('open');
    expect(miss.round.mistakes).toBe(1);
    expect(miss.round.open).toEqual([0, 2]);
    expect(miss.closed).toBeNull();
    expect(miss.phase).toBe('play');
  });

  it('closes the oldest card when a third one opens and scores only the latest pair', () => {
    let round = fresh(cards, ['egg', 'noodle', 'spam']);
    round = revealPair(round, 2).round;
    round = revealPair(round, 0).round;
    const linked = revealPair(round, 1);
    expect(linked.outcome).toBe('match');
    expect(linked.closed).toBe(2);
    expect(linked.matched).toEqual([0, 1]);
    expect(linked.round.open).toEqual([]);
    expect(linked.round.removed).toEqual([0, 1]);
    expect(linked.round.found).toEqual(['egg']);

    round = fresh(cards, ['egg', 'noodle', 'spam']);
    round = revealPair(round, 0).round;
    round = revealPair(round, 2).round;
    const shifted = revealPair(round, 1);
    expect(shifted.outcome).toBe('open');
    expect(shifted.closed).toBe(0);
    expect(shifted.round.open).toEqual([2, 1]);
    expect(shifted.round.removed).toEqual([]);
  });

  it('sends a matching pair into the pot and wins when every ingredient is paired', () => {
    let round = fresh(cards, ['egg', 'noodle', 'spam']);
    round = revealPair(round, 0).round;
    const egg = revealPair(round, 1);
    expect(egg.outcome).toBe('match');
    expect(egg.round.found).toEqual(['egg']);
    expect(egg.round.removed).toEqual([0, 1]);
    round = revealPair(egg.round, 3).round;
    round = revealPair(round, 4).round;
    round = revealPair(round, 5).round;
    const last = revealPair(round, 6);
    expect(last.outcome).toBe('match');
    expect(last.phase).toBe('won');
    expect(last.round.found).toEqual(['egg', 'noodle', 'spam']);
    expect(phaseOf(last.round)).toBe('won');
  });

  it('keeps the chain going after mismatches because time is not limited', () => {
    let round = fresh(cards, ['egg', 'noodle', 'spam']);
    round = revealPair(round, 0).round;
    round = revealPair(round, 2).round;
    round = revealPair(round, 3).round;
    round = revealPair(round, 7).round;
    round = revealPair(round, 5).round;
    const next = revealPair(round, 8);
    expect(next.outcome).toBe('open');
    expect(next.round.mistakes).toBe(5);
    expect(next.round.open).toEqual([5, 8]);
    expect(next.phase).toBe('play');
    const again = revealPair(next.round, 0);
    expect(again.outcome).toBe('open');
    expect(again.closed).toBe(5);
    expect(again.round.open).toEqual([8, 0]);
  });

  it('formats the open-ended clock', () => {
    expect(formatElapsed(0)).toBe('0:00');
    expect(formatElapsed(9)).toBe('0:09');
    expect(formatElapsed(65)).toBe('1:05');
  });

  it('ignores a card that is already open or already removed', () => {
    const first = revealPair(fresh(cards, ['egg', 'noodle', 'spam']), 0);
    expect(revealPair(first.round, 0).outcome).toBe('ignore');
    const matched = revealPair(first.round, 1);
    expect(revealPair(matched.round, 0).outcome).toBe('ignore');
    expect(revealPair(matched.round, 1).outcome).toBe('ignore');
  });
});

describe('duel recipes', () => {
  it('picks two different dishes with the same ingredient count', () => {
    for (let i = 0; i < 30; i += 1) {
      const [a, b] = pickDuelRecipes(RECIPES, rngFrom(100 + i));
      expect(a.id).not.toBe(b.id);
      expect(a.ingredientIds.length).toBe(b.ingredientIds.length);
      const cards = dealDuelCards(a.ingredientIds, b.ingredientIds, ALL_INGREDIENT_IDS, rngFrom(200 + i));
      expect(cards).toHaveLength(CARD_COUNT);
      for (const id of new Set([...a.ingredientIds, ...b.ingredientIds])) {
        expect(cards.filter((card) => card === id)).toHaveLength(2);
      }
    }
  });
});

describe('duel seats', () => {
  const cards = [
    'egg', 'egg', 'onion', 'noodle', 'noodle',
    'spam', 'spam', 'fish', 'milk', 'rice',
    'garlic', 'butter', 'potato', 'ham', 'peas',
    'beef', 'tofu', 'corn', 'shrimp', 'cabbage',
  ];
  const recipe = ['egg', 'noodle', 'spam'];

  it('keeps matched cards on the table for the other seat', () => {
    let a = emptySeat();
    a = revealSeat(cards, recipe, a, 0).seat;
    const match = revealSeat(cards, recipe, a, 1);
    expect(match.outcome).toBe('match');
    expect(match.seat.cleared).toEqual([0, 1]);
    expect(match.seat.found).toEqual(['egg']);

    let b = emptySeat();
    b = revealSeat(cards, recipe, b, 0).seat;
    const again = revealSeat(cards, recipe, b, 1);
    expect(again.outcome).toBe('match');
    expect(again.seat.found).toEqual(['egg']);
  });

  it('merges both open chains for the shared board', () => {
    let a = emptySeat();
    let b = emptySeat();
    a = revealSeat(cards, recipe, a, 0).seat;
    b = revealSeat(cards, recipe, b, 2).seat;
    b = revealSeat(cards, recipe, b, 3).seat;
    expect(visibleOpens([a, b]).sort((x, y) => x - y)).toEqual([0, 2, 3]);
    expect(openOwners([a, b]).get(0)).toEqual([0]);
    expect(openOwners([a, b]).get(2)).toEqual([1]);
  });

  it('lets a seat reveal a card the other seat already has open', () => {
    let a = emptySeat();
    let b = emptySeat();
    a = revealSeat(cards, recipe, a, 0).seat;
    const shared = revealSeat(cards, recipe, b, 0);
    expect(shared.outcome).toBe('open');
    expect(shared.seat.open).toEqual([0]);
    expect(openOwners([a, shared.seat]).get(0)).toEqual([0, 1]);
  });

  it('ignores a seat clicking its own cleared cards', () => {
    let a = emptySeat();
    a = revealSeat(cards, recipe, a, 0).seat;
    a = revealSeat(cards, recipe, a, 1).seat;
    expect(revealSeat(cards, recipe, a, 0).outcome).toBe('ignore');
  });

  it('does not score a pair that is not on this seat menu', () => {
    let a = emptySeat();
    a = revealSeat(cards, ['noodle', 'spam'], a, 0).seat;
    const miss = revealSeat(cards, ['noodle', 'spam'], a, 1);
    expect(miss.outcome).toBe('open');
    expect(miss.seat.found).toEqual([]);
    expect(miss.seat.cleared).toEqual([]);
    expect(miss.seat.open).toEqual([0, 1]);
  });
});

describe('board', () => {
  it('lays out 20 distinct slots, 4 across and 5 deep', () => {
    const slots = Array.from({ length: 20 }, (_, index) => slotPosition(index));
    const keys = new Set(slots.map((slot) => `${slot.x},${slot.z}`));
    expect(keys.size).toBe(20);
    expect(slots[0]!.x).toBeLessThan(slots[3]!.x);
    expect(slots[0]!.z).toBeLessThan(slots[4]!.z);
    expect(slots[0]!.z).toBeLessThan(slots[19]!.z);
    expect(HOME.x).toBe(0);
    expect(HOME.z).toBe(0);
    expect(HOME.z).toBeGreaterThan(slots[0]!.z);
    expect(HOME.z).toBeLessThan(slots[19]!.z);
  });
});
