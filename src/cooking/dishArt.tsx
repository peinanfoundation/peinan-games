import type { ReactNode } from 'react';

function Art({ children }: { children: ReactNode }) {
  return (
    <svg className="dish-art" viewBox="0 0 64 64" aria-hidden="true">
      {children}
    </svg>
  );
}

function Rice() {
  return (
    <g>
      <ellipse cx="32" cy="42" rx="20" ry="11" fill="#f7f1e6" />
      <ellipse cx="22" cy="38" rx="3.2" ry="1.8" fill="#fff" />
      <ellipse cx="33" cy="36" rx="2.6" ry="1.5" fill="#fff" opacity="0.85" />
      <ellipse cx="42" cy="41" rx="3" ry="1.7" fill="#eadfcb" />
      <ellipse cx="28" cy="46" rx="2.8" ry="1.5" fill="#eadfcb" />
    </g>
  );
}

function Plate({ children }: { children: ReactNode }) {
  return (
    <Art>
      <ellipse cx="32" cy="50" rx="28" ry="10" fill="#fffaf4" stroke="#e4d3c0" strokeWidth="2" />
      {children}
    </Art>
  );
}

function Bowl({ fill, children }: { fill: string; children?: ReactNode }) {
  return (
    <Art>
      <path d="M6 28h52c0 16-10 28-26 28S6 44 6 28z" fill="#fffdf8" stroke="#e4d5c6" strokeWidth="2" />
      <ellipse cx="32" cy="28" rx="26" ry="9" fill="#fffdf8" stroke="#e4d5c6" strokeWidth="2" />
      <ellipse cx="32" cy="30" rx="20" ry="7" fill={fill} />
      {children}
    </Art>
  );
}

function Glass({ liquid, children }: { liquid: string; children?: ReactNode }) {
  return (
    <Art>
      <path d="M18 6h28l-3 44a8 8 0 0 1-8 6h-6a8 8 0 0 1-8-6z" fill="#f4f9fc" stroke="#d5e2ea" strokeWidth="2" />
      <path d="M20 24h24l-2.2 24a6 6 0 0 1-6 5h-7.6a6 6 0 0 1-6-5z" fill={liquid} />
      <path d="M22 10h4l-1 40" stroke="#fff" strokeWidth="2" opacity="0.7" />
      {children}
    </Art>
  );
}

const ARTS: Record<string, () => ReactNode> = {
  'pork-rice': () => (
    <Plate>
      <Rice />
      <ellipse cx="30" cy="30" rx="16" ry="8" fill="#e7a06a" />
      <rect x="40" y="24" width="4" height="12" rx="1" fill="#f4e2c8" />
      <ellipse cx="22" cy="26" rx="6" ry="4" fill="#d6453d" />
      <path d="M18 30c6-2 16 0 22 2 1 3-2 6-8 7s-14-2-14-9z" fill="#f2c14b" opacity="0.92" />
    </Plate>
  ),
  'spam-noodle': () => (
    <Bowl fill="#f0c14a">
      <path d="M16 30c4 2 6-2 10 0s6 2 10 0 6-2 10 0" stroke="#e2a84a" strokeWidth="2" fill="none" />
      <rect x="18" y="22" width="14" height="8" rx="2" fill="#e7a0a0" stroke="#d47878" />
      <ellipse cx="40" cy="24" rx="7" ry="5" fill="#fff" />
      <ellipse cx="40" cy="24" rx="3" ry="2.2" fill="#f6d34d" />
    </Bowl>
  ),
  'spam-rice': () => (
    <Plate>
      <Rice />
      <rect x="16" y="24" width="16" height="9" rx="2" fill="#e7a0a0" stroke="#d47878" />
      <ellipse cx="40" cy="28" rx="8" ry="6" fill="#fff" />
      <ellipse cx="40" cy="28" rx="3.2" ry="2.4" fill="#f6d34d" />
    </Plate>
  ),
  'pineapple-butter': () => (
    <Art>
      <ellipse cx="30" cy="36" rx="20" ry="16" fill="#e7b56a" />
      <path d="M16 30c6-8 22-8 28 0" stroke="#c9843a" strokeWidth="2" fill="none" />
      <path d="M18 36c8-6 18-6 26 0" stroke="#c9843a" strokeWidth="2" fill="none" />
      <path d="M22 24c4 8 4 16 0 24M30 20c2 10 2 20 0 28M38 24c-4 8-4 16 0 24" stroke="#c9843a" strokeWidth="1.6" fill="none" />
      <rect x="34" y="30" width="18" height="10" rx="2" fill="#ffe08a" stroke="#f0c14a" strokeWidth="1.5" transform="rotate(-18 43 35)" />
    </Art>
  ),
  'french-toast': () => (
    <Art>
      <path d="M8 24h40l8 10v18H16L8 42z" fill="#c9843a" />
      <path d="M12 18h40l6 8H18z" fill="#f2c56a" />
      <path d="M16 28h34" stroke="#a86b32" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="30" cy="16" rx="8" ry="4" fill="#ffe08a" />
    </Art>
  ),
  'ham-egg-toast': () => (
    <Art>
      <rect x="12" y="16" width="40" height="14" rx="3" fill="#f3d7a8" />
      <rect x="12" y="36" width="40" height="12" rx="3" fill="#e8c48a" />
      <rect x="16" y="28" width="32" height="6" fill="#e07a7a" />
      <ellipse cx="32" cy="31" rx="8" ry="5" fill="#f6d34d" />
    </Art>
  ),
  'bacon-egg-toast': () => (
    <Art>
      <rect x="12" y="16" width="40" height="14" rx="3" fill="#f3d7a8" />
      <rect x="12" y="36" width="40" height="12" rx="3" fill="#e8c48a" />
      <path d="M16 28c6 2 8-2 14 0s8 2 16 0v6c-8 2-10-2-16 0s-8 2-14 0z" fill="#d45555" />
      <path d="M20 30c4 1 5-1 9 0" stroke="#f4d0c8" strokeWidth="2" />
      <ellipse cx="40" cy="31" rx="6" ry="4" fill="#f6d34d" />
    </Art>
  ),
  'ham-macaroni': () => (
    <Bowl fill="#f6e2a8">
      <path d="M18 28c3 3 3 1 6 3s3 1 6-1 3 3 6 1 3-3 6-1" stroke="#f0c14a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="20" y="24" width="8" height="6" rx="1" fill="#e07a7a" />
      <rect x="34" y="26" width="7" height="5" rx="1" fill="#e07a7a" />
      <ellipse cx="30" cy="22" rx="5" ry="3" fill="#f6d34d" />
    </Bowl>
  ),
  'milk-tea': () => <Glass liquid="#d7a36a" />,
  yuenyeung: () => (
    <Glass liquid="#6b3e2e">
      <path d="M32 24h12l-1 24a6 6 0 0 1-6 5h-5z" fill="#c6864a" />
    </Glass>
  ),
  'lemon-tea': () => (
    <Glass liquid="#e8b85a">
      <rect x="24" y="30" width="6" height="6" rx="1" fill="#f7fbff" opacity="0.85" />
      <rect x="34" y="36" width="5" height="5" rx="1" fill="#f7fbff" opacity="0.75" />
      <circle cx="46" cy="18" r="7" fill="#f2d04b" stroke="#e0b020" />
      <path d="M46 12v12M40 18h12" stroke="#e0b020" strokeWidth="1.2" />
    </Glass>
  ),
  'egg-tart': () => (
    <Art>
      <path d="M12 30c2 16 8 22 20 22s18-6 20-22c-4 4-10 6-20 6s-16-2-20-6z" fill="#e2b07a" />
      <path d="M14 30c1 4 3 4 5 0s4-4 6 0 4 4 6 0 4-4 6 0 4 4 6 0 3 4 5 0" stroke="#c9843a" strokeWidth="2" fill="none" />
      <ellipse cx="32" cy="28" rx="16" ry="9" fill="#f6d35a" />
      <ellipse cx="26" cy="26" rx="4" ry="2" fill="#ffe9a0" opacity="0.8" />
    </Art>
  ),
  'portuguese-chicken': () => (
    <Plate>
      <ellipse cx="32" cy="40" rx="18" ry="10" fill="#f2c14b" />
      <ellipse cx="24" cy="32" rx="7" ry="5" fill="#e8a15a" />
      <ellipse cx="38" cy="30" rx="6" ry="4" fill="#e6c07a" />
      <circle cx="32" cy="36" r="4" fill="#c9843a" />
    </Plate>
  ),
  'swiss-wing': () => (
    <Plate>
      <path d="M10 36c2-8 8-14 16-15 3 9 1 18-4 24-6 2-12-2-12-9z" fill="#f0c49a" />
      <path d="M12 34c2-6 6-10 12-11 2 8 1 15-3 19-5 1.5-9-2-9-8z" fill="#e8a15a" />
      <path d="M24 22c8-6 18-8 26-2 2 8-4 15-12 17-8 0-14-6-14-15z" fill="#e8944a" />
      <path d="M28 24c6-4 14-5 20-1 1 6-3 11-10 12-6 0-11-4-10-11z" fill="#d9894a" />
      <path d="M46 22c6-2 10 2 10 8 0 4-4 6-8 5-3-1-4-5-2-13z" fill="#f4e2c8" stroke="#e2c8a0" strokeWidth="1.2" />
      <path d="M18 40c6 4 14 8 22 6" stroke="#c4473a" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.75" />
      <circle cx="26" cy="26" r="2.4" fill="#c4684a" opacity="0.5" />
      <ellipse cx="40" cy="44" rx="7" ry="3" fill="#f2c14b" opacity="0.85" />
    </Plate>
  ),
  'pepper-beef-rice': () => (
    <Plate>
      <Rice />
      <path d="M16 28c6-6 10 2 16-2s8 4 14 0l2 6c-6 4-10-2-16 2s-10-6-16-2z" fill="#5a4038" />
      <circle cx="22" cy="26" r="1.2" fill="#2a2420" />
      <circle cx="30" cy="30" r="1.2" fill="#2a2420" />
      <circle cx="40" cy="27" r="1.2" fill="#2a2420" />
    </Plate>
  ),
  'tomato-pork-rice': () => (
    <Plate>
      <Rice />
      <ellipse cx="32" cy="30" rx="16" ry="8" fill="#e7a06a" />
      <path d="M16 30c8 6 24 6 32 0 0 6-8 12-16 12S16 36 16 30z" fill="#d23b32" opacity="0.9" />
    </Plate>
  ),
  borscht: () => (
    <Bowl fill="#c4473a">
      <ellipse cx="22" cy="28" rx="5" ry="3" fill="#f2c8c4" />
      <rect x="30" y="24" width="8" height="6" rx="1" fill="#8d4a3a" />
      <path d="M40 26c2 2 4 1 6 3" stroke="#7dcea0" strokeWidth="3" strokeLinecap="round" />
    </Bowl>
  ),
  pizza: () => (
    <Art>
      <circle cx="32" cy="32" r="26" fill="#e2b07a" />
      <circle cx="32" cy="32" r="20" fill="#d6453d" />
      <circle cx="32" cy="32" r="16" fill="#f2c14b" />
      <circle cx="26" cy="28" r="3.2" fill="#c4473a" />
      <circle cx="36" cy="34" r="3" fill="#c4473a" />
      <path d="M30 22l4 6-6 2z" fill="#f2d04b" />
      <path d="M40 24l3 5-5 1z" fill="#f2d04b" />
    </Art>
  ),
  bolognese: () => (
    <Art>
      <ellipse cx="32" cy="46" rx="22" ry="8" fill="#f7f1e6" />
      <path d="M16 30c6 8 8-6 14 2s8 8 16-2" stroke="#f0c14a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M18 38c8 6 20 6 28 0" stroke="#d23b32" strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="28" cy="36" r="2" fill="#8d4a3a" />
      <circle cx="36" cy="38" r="2" fill="#8d4a3a" />
    </Art>
  ),
  'cream-pasta': () => (
    <Art>
      <ellipse cx="32" cy="46" rx="22" ry="8" fill="#f7f1e6" />
      <path d="M16 32c6 8 8-6 14 2s8 8 16-2" stroke="#f0c14a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M18 40c8 5 20 5 28 0" stroke="#f7f1e4" strokeWidth="7" fill="none" strokeLinecap="round" />
      <ellipse cx="42" cy="30" rx="6" ry="4" fill="#c4a484" />
      <ellipse cx="42" cy="30" rx="2" ry="1.4" fill="#8d6e63" />
    </Art>
  ),
  'fish-chips': () => (
    <Art>
      <rect x="8" y="18" width="8" height="30" rx="2" fill="#f2c14b" transform="rotate(-8 12 33)" />
      <rect x="18" y="16" width="8" height="32" rx="2" fill="#e2a84a" />
      <rect x="28" y="20" width="7" height="26" rx="2" fill="#f2c14b" transform="rotate(6 31 33)" />
      <path d="M40 40c8-18 16-18 16 2 0 8-6 14-12 14s-8-6-4-16z" fill="#e7b56a" stroke="#c9843a" strokeWidth="1.5" />
    </Art>
  ),
  burger: () => (
    <Art>
      <path d="M12 26c0-8 8-14 20-14s20 6 20 14z" fill="#e2a04a" />
      <rect x="12" y="26" width="40" height="5" fill="#7dcea0" />
      <rect x="12" y="31" width="40" height="5" fill="#f2c14b" />
      <rect x="12" y="36" width="40" height="7" rx="1" fill="#8d4a3a" />
      <path d="M12 43h40c0 6-8 10-20 10S12 49 12 43z" fill="#c9843a" />
    </Art>
  ),
  'baked-seafood-rice': () => (
    <Plate>
      <Rice />
      <path d="M18 30c4-8 8-2 8 2" stroke="#e07a6a" strokeWidth="3" fill="none" />
      <circle cx="20" cy="32" r="2" fill="#e07a6a" />
      <ellipse cx="36" cy="28" rx="6" ry="3" fill="#f4e2ea" stroke="#e7b7c8" />
      <ellipse cx="28" cy="24" rx="5" ry="3" fill="#f2c14b" />
    </Plate>
  ),
  'mushroom-soup': () => (
    <Bowl fill="#f3e6d4">
      <ellipse cx="24" cy="26" rx="5" ry="3" fill="#c4a484" />
      <ellipse cx="36" cy="28" rx="4" ry="2.4" fill="#8d6e63" />
    </Bowl>
  ),
  'corn-soup': () => (
    <Bowl fill="#f6d423">
      <ellipse cx="24" cy="28" rx="2" ry="1.2" fill="#fff3a0" />
      <ellipse cx="32" cy="26" rx="2" ry="1.2" fill="#fff3a0" />
      <ellipse cx="38" cy="30" rx="2" ry="1.2" fill="#e6c020" />
    </Bowl>
  ),
  sirloin: () => (
    <Plate>
      <ellipse cx="22" cy="40" rx="7" ry="4" fill="#e6c07a" />
      <ellipse cx="30" cy="30" rx="14" ry="8" fill="#8d4a3a" />
      <path d="M20 28h16M22 32h14" stroke="#5a3028" strokeWidth="1.4" />
      <ellipse cx="44" cy="36" rx="5" ry="3" fill="#c4a484" />
    </Plate>
  ),
  'baked-potato': () => (
    <Art>
      <ellipse cx="32" cy="36" rx="22" ry="14" fill="#c4a484" />
      <path d="M20 34c8-8 16-8 24 0" fill="#f7f1e6" />
      <ellipse cx="28" cy="32" rx="5" ry="3" fill="#f2c14b" />
      <rect x="34" y="28" width="8" height="5" rx="1" fill="#ffe08a" />
    </Art>
  ),
  'charsiu-rice': () => (
    <Plate>
      <Rice />
      <path d="M16 26c2 8 4 10 6 10s4-2 6-10" fill="#d64545" />
      <path d="M26 24c2 10 4 12 6 12s4-2 6-12" fill="#c4473a" />
      <path d="M36 26c2 8 4 10 6 10s4-2 6-10" fill="#e07070" />
      <path d="M18 30h6M28 28h6M38 30h6" stroke="#f8d0d0" strokeWidth="1.4" />
    </Plate>
  ),
  'duck-rice': () => (
    <Plate>
      <Rice />
      <path d="M16 34c4-12 20-14 30-4 2 8-6 14-16 14S14 40 16 34z" fill="#8d3a2a" />
      <path d="M22 30c6-2 12-2 18 2" stroke="#f2c14b" strokeWidth="2" />
    </Plate>
  ),
  'white-chicken': () => (
    <Art>
      <ellipse cx="28" cy="40" rx="18" ry="12" fill="#f4efe4" stroke="#e6d8c4" />
      <path d="M16 36c4-10 12-12 18-4 4 6 2 12-4 14" fill="#fffaf3" />
      <path d="M22 34c6 2 10 2 14-2" stroke="#e7d3a4" strokeWidth="2" />
      <ellipse cx="48" cy="44" rx="8" ry="5" fill="#e7f5ea" />
      <path d="M44 42c2 2 4 1 6 3M46 46c2-2 4-1 6 1" stroke="#3d9a4a" strokeWidth="1.5" />
    </Art>
  ),
  'hainan-chicken': () => (
    <Plate>
      <ellipse cx="30" cy="42" rx="16" ry="9" fill="#f3e2b0" />
      <path d="M18 30c6-8 16-6 16 2 0 6-6 10-12 8" fill="#f7f1e6" stroke="#e7d3a4" />
      <ellipse cx="44" cy="36" rx="6" ry="3" fill="#6aaa4a" />
      <path d="M46 24c2 6-2 8-2 8" stroke="#e53935" strokeWidth="3" strokeLinecap="round" />
    </Plate>
  ),
  'beef-hofun': () => (
    <Art>
      <path d="M8 40c8-6 14 4 22-2s12 6 24-4" stroke="#f7e7c4" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M10 32c10-4 12 6 22 0s14 4 20-2" stroke="#f3e2b8" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M18 28c4-4 8 2 12-2" stroke="#8d4a3a" strokeWidth="4" strokeLinecap="round" />
      <path d="M36 26c3 4 6-2 10 2" stroke="#8d4a3a" strokeWidth="4" strokeLinecap="round" />
      <path d="M28 40c2 2 3 1 5 3" stroke="#b7d36a" strokeWidth="2" />
    </Art>
  ),
  'singapore-noodle': () => (
    <Art>
      <path d="M10 28c12 4 10-6 22-2s12 8 22 2" stroke="#e6a317" strokeWidth="3" fill="none" />
      <path d="M8 36c14 4 12-6 24-2s14 8 24 0" stroke="#f2c14b" strokeWidth="3" fill="none" />
      <path d="M12 44c12 2 14-6 24-2s12 6 18 0" stroke="#e09a20" strokeWidth="3" fill="none" />
      <path d="M20 30c3-5 4 2 4 2" stroke="#e07a6a" strokeWidth="3" />
      <rect x="40" y="32" width="8" height="4" rx="1" fill="#d64545" />
      <rect x="30" y="40" width="6" height="5" rx="1" fill="#3d9a4a" />
    </Art>
  ),
  yeungchow: () => (
    <Art>
      <ellipse cx="32" cy="36" rx="24" ry="16" fill="#f2c56a" />
      <ellipse cx="22" cy="32" rx="3" ry="2" fill="#fff" />
      <ellipse cx="34" cy="40" rx="3" ry="2" fill="#f6d34d" />
      <path d="M40 28c3-6 4 1 4 1" stroke="#e07a6a" strokeWidth="3" />
      <rect x="18" y="36" width="7" height="4" rx="1" fill="#d64545" />
      <circle cx="44" cy="40" r="2.2" fill="#43a047" />
      <circle cx="28" cy="28" r="2" fill="#43a047" />
    </Art>
  ),
  'wonton-noodle': () => (
    <Bowl fill="#f0c14a">
      <path d="M22 20c-2 6 2 8 6 4 2-4 6-2 6 2 0 4 6 2 6-2" fill="#f6e3c4" stroke="#e2b07a" />
      <path d="M36 18c2 6 8 6 8 0 0-4-4-6-8-2z" fill="#f6e3c4" stroke="#e2b07a" />
    </Bowl>
  ),
  'brisket-noodle': () => (
    <Bowl fill="#e7d3a4">
      <ellipse cx="22" cy="26" rx="6" ry="4" fill="#8d4a3a" />
      <ellipse cx="34" cy="28" rx="5" ry="3.5" fill="#a86a52" />
      <ellipse cx="44" cy="26" rx="4" ry="3" fill="#f4f0e6" />
    </Bowl>
  ),
  'cart-noodle': () => (
    <Bowl fill="#f0c14a">
      <circle cx="22" cy="26" r="4" fill="#f7d6c8" stroke="#e7b7a8" />
      <circle cx="32" cy="28" r="4" fill="#8d4a3a" />
      <path d="M40 22c2 6 8 6 8 0" stroke="#3d9a4a" strokeWidth="3" fill="none" />
      <ellipse cx="46" cy="30" rx="4" ry="2" fill="#f4f0e6" />
    </Bowl>
  ),
  'century-congee': () => (
    <Bowl fill="#f7f1e4">
      <path d="M20 24c4 6 8 6 10 0" fill="#3a3a3a" />
      <path d="M24 26c2 2 4 2 5 0" stroke="#7dcea0" strokeWidth="1.5" />
      <path d="M36 24c6 2 8 4 10 2" stroke="#e7a06a" strokeWidth="3" strokeLinecap="round" />
    </Bowl>
  ),
  'jidi-congee': () => (
    <Bowl fill="#f7f1e4">
      <ellipse cx="22" cy="28" rx="5" ry="3" fill="#9a3d45" />
      <ellipse cx="34" cy="26" rx="6" ry="3" fill="#d8e8f4" />
      <path d="M40 28c4 2 8 1 10 3" stroke="#e7a06a" strokeWidth="3" strokeLinecap="round" />
    </Bowl>
  ),
  'sampan-congee': () => (
    <Bowl fill="#f7f1e4">
      <ellipse cx="24" cy="28" rx="6" ry="3" fill="#f4e2ea" stroke="#e7b7c8" />
      <ellipse cx="36" cy="26" rx="5" ry="3" fill="#9ec9e6" />
      <circle cx="44" cy="30" r="2" fill="#d7a15a" />
      <circle cx="28" cy="24" r="1.6" fill="#d7a15a" />
    </Bowl>
  ),
  'har-gow': () => (
    <Art>
      <path d="M10 34c2-16 18-22 28-14 8 6 16 6 18 14-10 12-34 14-46 0z" fill="#f7fbf8" stroke="#d7ebe0" strokeWidth="2" />
      <path d="M14 32c4-6 8-8 12-6M20 36c4-4 8-5 12-3M26 40c4-3 8-3 12-1" stroke="#b7d8c8" strokeWidth="1.4" fill="none" />
      <path d="M28 30c4-6 10-6 12 0-4 4-10 4-12 0z" fill="#ff8f8f" />
    </Art>
  ),
  'siu-mai': () => (
    <Art>
      <path fill="#f6d15a" d="M14 30c1 16 8 24 18 24s17-8 18-24c-2-1.5-6 2-18 2S16 28.5 14 30z" />
      <path d="M22 31c1.2 8 4.2 16 10 20M32 30v22M42 31c-1.2 8-4.2 16-10 20" fill="none" stroke="#d7a43a" strokeWidth="1.6" />
      <ellipse cx="32" cy="28" rx="16" ry="8" fill="#f8dc78" />
      <ellipse cx="32" cy="27" rx="10" ry="5.2" fill="#e07a62" />
      <circle cx="32" cy="25.5" r="3.3" fill="#f08a28" />
    </Art>
  ),
  'blackbean-rib': () => (
    <Art>
      <path d="M12 40c8-18 20-20 28-8 6 8 4 16-4 18" fill="#e0a070" />
      <path d="M30 28c10-6 20 2 18 12" fill="#d4897a" />
      <circle cx="20" cy="30" r="3" fill="#f4e2c8" />
      <circle cx="44" cy="36" r="3" fill="#f4e2c8" />
      <circle cx="24" cy="44" r="2" fill="#3a342f" />
      <circle cx="34" cy="40" r="2" fill="#3a342f" />
      <circle cx="40" cy="46" r="1.6" fill="#3a342f" />
    </Art>
  ),
  'mui-pork': () => (
    <Art>
      <rect x="14" y="16" width="36" height="8" rx="2" fill="#e7b7a8" />
      <rect x="14" y="24" width="36" height="7" fill="#6a7a3a" />
      <rect x="14" y="31" width="36" height="8" fill="#f0c8bc" />
      <rect x="14" y="39" width="36" height="7" fill="#4e5a32" />
      <path d="M18 20h8M20 35h10" stroke="#fff" strokeWidth="1.5" opacity="0.7" />
    </Art>
  ),
  'sweet-sour-pork': () => (
    <Art>
      <ellipse cx="32" cy="40" rx="22" ry="12" fill="#f8e6dc" />
      <rect x="16" y="28" width="10" height="10" rx="2" fill="#e7a06a" />
      <rect x="28" y="24" width="10" height="10" rx="2" fill="#f2c14b" />
      <rect x="38" y="32" width="10" height="10" rx="2" fill="#e7a06a" />
      <path d="M22 22l4 6 4-8" fill="#f2d04b" />
      <rect x="40" y="22" width="7" height="7" rx="1" fill="#3d9a4a" />
      <path d="M18 40c10 6 22 4 30-2" stroke="#d23b32" strokeWidth="3" fill="none" />
    </Art>
  ),
  kungpao: () => (
    <Art>
      <rect x="14" y="30" width="10" height="10" rx="2" fill="#e8a15a" />
      <rect x="28" y="24" width="10" height="10" rx="2" fill="#f0b56a" />
      <rect x="40" y="34" width="10" height="10" rx="2" fill="#e8a15a" />
      <circle cx="22" cy="24" r="3" fill="#d7a15a" />
      <circle cx="36" cy="40" r="3" fill="#c48a3a" />
      <circle cx="46" cy="26" r="2.4" fill="#c48a3a" />
      <path d="M18 18c2 6-2 8 2 12" stroke="#e53935" strokeWidth="3" strokeLinecap="round" />
      <rect x="30" y="36" width="6" height="6" fill="#3d9a4a" />
    </Art>
  ),
  mapo: () => (
    <Bowl fill="#c4473a">
      <rect x="20" y="22" width="7" height="7" fill="#f7f1e6" />
      <rect x="29" y="24" width="7" height="7" fill="#fffaf3" />
      <rect x="36" y="21" width="7" height="7" fill="#f4efe4" />
      <circle cx="26" cy="32" r="1.3" fill="#f2c14b" />
      <path d="M40 20c1 4-1 5 1 7" stroke="#e53935" strokeWidth="2" />
    </Bowl>
  ),
  'yuxiang-eggplant': () => (
    <Art>
      <ellipse cx="32" cy="44" rx="22" ry="10" fill="#f3e0c8" />
      <ellipse cx="24" cy="32" rx="6" ry="12" fill="#7e57c2" transform="rotate(-20 24 32)" />
      <ellipse cx="36" cy="30" rx="6" ry="12" fill="#6a46b0" transform="rotate(12 36 30)" />
      <ellipse cx="46" cy="36" rx="5" ry="10" fill="#8d68c8" transform="rotate(24 46 36)" />
      <path d="M20 40c8 4 16 4 26 0" stroke="#c4684a" strokeWidth="3" />
    </Art>
  ),
  'steamed-fish': () => (
    <Art>
      <ellipse cx="32" cy="36" rx="26" ry="12" fill="#fffaf4" stroke="#e7d8c8" />
      <path d="M10 36c10-10 28-10 40 0-12 8-28 8-40 0z" fill="#8ec4e8" />
      <circle cx="44" cy="34" r="1.6" fill="#1c3a4a" />
      <path d="M18 32h10M20 38h8" stroke="#f4e8c1" strokeWidth="2" />
      <path d="M30 30c2 4 2 8 0 12" stroke="#3d9a4a" strokeWidth="2" />
      <path d="M36 34c6 1 8 2 10 1" stroke="#8d4a32" strokeWidth="2" />
    </Art>
  ),
  'ginger-crab': () => (
    <Art>
      <circle cx="30" cy="36" r="12" fill="#ff7043" />
      <circle cx="18" cy="30" r="5" fill="#ff8a5b" />
      <circle cx="42" cy="30" r="5" fill="#ff8a5b" />
      <path d="M12 24c-6-6-8 2-4 6M48 22c8-4 8 6 2 8" stroke="#e25a30" strokeWidth="2" fill="none" />
      <ellipse cx="24" cy="22" rx="4" ry="2" fill="#e6c07a" />
      <ellipse cx="36" cy="18" rx="3" ry="2" fill="#e6c07a" />
      <path d="M28 16c2 6 6 6 8 0" stroke="#5fa36a" strokeWidth="2" />
    </Art>
  ),
  claypot: () => (
    <Art>
      <path d="M12 28h40l-4 22H16z" fill="#8a5a3c" />
      <ellipse cx="32" cy="28" rx="22" ry="8" fill="#a87450" />
      <ellipse cx="32" cy="28" rx="16" ry="5" fill="#f6f0e4" />
      <rect x="22" y="22" width="10" height="5" rx="2" fill="#b43838" />
      <ellipse cx="38" cy="26" rx="5" ry="3" fill="#f6d34d" />
      <path d="M8 24h6M50 24h6" stroke="#6b4428" strokeWidth="3" strokeLinecap="round" />
    </Art>
  ),
  'mango-pomelo': () => (
    <Glass liquid="#f2c14b">
      <circle cx="26" cy="36" r="2" fill="#fff" />
      <circle cx="32" cy="42" r="2" fill="#fff" />
      <circle cx="36" cy="34" r="1.7" fill="#fff" />
      <path d="M24 28c4-4 8-2 10 2" fill="#f7f4ee" />
    </Glass>
  ),
  'tomato-egg': () => (
    <Art>
      <path d="M12 36c4-12 10-16 16-8 4 6 8 4 14-2 6 8 8 16 2 22-8 8-24 8-32-12z" fill="#f6d34d" />
      <path d="M20 28c6 4 8 10 4 16" fill="#fff3a0" />
      <path d="M34 24c6 2 10 10 6 16-6-2-10-8-6-16z" fill="#e23d3d" />
      <path d="M40 22c4 4 4 10 0 12" fill="#d23b32" />
    </Art>
  ),
  'radish-cake': () => (
    <Art>
      <rect x="12" y="30" width="28" height="16" rx="2" fill="#f7f4ee" stroke="#e4dcc8" />
      <rect x="24" y="16" width="28" height="16" rx="2" fill="#f4efe4" stroke="#e4dcc8" />
      <rect x="24" y="28" width="28" height="4" fill="#e2a04a" />
      <circle cx="32" cy="22" r="1.4" fill="#e07a6a" />
      <circle cx="40" cy="24" r="1.2" fill="#c45c4a" />
      <rect x="30" y="20" width="6" height="2" rx="1" fill="#b43838" />
    </Art>
  ),
};

export const DISH_ART_IDS = Object.keys(ARTS);

export function DishArt({ id }: { id: string }) {
  const draw = ARTS[id];
  if (!draw) return null;
  return draw();
}
