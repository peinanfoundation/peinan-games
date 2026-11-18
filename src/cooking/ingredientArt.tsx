import type { ReactNode } from 'react';

function Art({ children }: { children: ReactNode }) {
  return (
    <svg className="ingredient-art" viewBox="0 0 64 64" aria-hidden="true">
      {children}
    </svg>
  );
}

/** 豬扒：帶骨橢圓肉排，粉肉色＋脂肪邊 */
function PorkChop() {
  return (
    <Art>
      <ellipse cx="34" cy="34" rx="20" ry="14" fill="#f0b29a" />
      <ellipse cx="34" cy="34" rx="16" ry="11" fill="#e08a72" />
      <path d="M22 30c6-4 18-4 24 0 1 4-4 8-12 9s-14-2-12-9z" fill="#f7cfc0" opacity="0.9" />
      <ellipse cx="14" cy="34" rx="5" ry="7" fill="#f6e4c8" stroke="#e2c8a0" strokeWidth="1.5" />
      <ellipse cx="14" cy="34" rx="2.2" ry="3.2" fill="#f0d7b0" />
      <path d="M24 28c4 2 8 2 12 0M26 38c5 2 10 2 14 0" stroke="#c4684a" strokeWidth="1.4" fill="none" opacity="0.55" />
    </Art>
  );
}

/** 牛扒：深色長形西冷，白脂肪邊＋烤紋 */
function BeefSteak() {
  return (
    <Art>
      <path
        d="M10 28c2-10 12-16 28-14 10 1 16 8 16 16s-6 14-16 15c-16 2-28-4-30-12 0-2 0-4 2-5z"
        fill="#6b2e28"
      />
      <path
        d="M14 30c2-7 10-12 24-10 8 1 12 6 12 12s-4 10-12 11c-14 1-24-4-26-10 0-1 0-2 2-3z"
        fill="#8d3a32"
      />
      <path d="M12 36c18 8 34 6 40-2" stroke="#f4e4c8" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <path d="M18 24l4 18M28 20l3 22M38 22l2 20M46 26l1 16" stroke="#5a241e" strokeWidth="1.8" opacity="0.55" />
      <ellipse cx="22" cy="32" rx="3" ry="2" fill="#a84a40" opacity="0.7" />
    </Art>
  );
}

/** 雞翼：翅中＋翅尖，可見關節與焦糖色 */
function ChickenWing() {
  return (
    <Art>
      <path d="M12 40c2-8 8-14 16-16 4 10 2 20-4 26-6 2-12-2-12-10z" fill="#f0c49a" />
      <path d="M14 38c2-6 6-10 12-12 2 8 1 16-3 20-5 1.5-9-2-9-8z" fill="#e8a15a" />
      <path d="M26 24c8-6 18-8 26-2 2 8-4 16-12 18-8 0-14-6-14-16z" fill="#e8944a" />
      <path d="M30 26c6-4 14-5 20-1 1 6-3 12-10 13-6 0-11-5-10-12z" fill="#d9894a" />
      <path d="M48 24c6-2 10 2 10 8 0 4-4 6-8 5-3-1-4-5-2-13z" fill="#f4e2c8" stroke="#e2c8a0" strokeWidth="1.2" />
      <circle cx="28" cy="28" r="3" fill="#c4684a" opacity="0.55" />
      <path d="M20 34c4 2 8 4 10 8M34 30c4 2 8 3 12 2" stroke="#b86a3a" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.7" />
    </Art>
  );
}

const ARTS: Record<string, () => ReactNode> = {
  pork: PorkChop,
  beef: BeefSteak,
  wing: ChickenWing,
};

export const INGREDIENT_ART_IDS = Object.keys(ARTS);

export function IngredientArt({ id }: { id: string }) {
  const draw = ARTS[id];
  if (!draw) return null;
  return draw();
}

export function hasIngredientArt(id: string) {
  return id in ARTS;
}
