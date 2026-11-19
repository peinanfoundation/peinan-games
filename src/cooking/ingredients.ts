export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export function ingredientImageUrl(id: string) {
  return `${import.meta.env.BASE_URL}ingredients/${id}.png`;
}

export type RecipeKind = 'cafe' | 'western' | 'chinese';

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  kind: RecipeKind;
  ingredientIds: string[];
}

export const INGREDIENTS: Ingredient[] = [
  { id: 'tomato', name: '番茄', emoji: '🍅', color: '#e23d3d' },
  { id: 'pork', name: '豬扒', emoji: '🍖', color: '#c4684a' },
  { id: 'cheese', name: '芝士', emoji: '🧀', color: '#f0a202' },
  { id: 'rice', name: '飯', emoji: '🍚', color: '#e7d3a4' },
  { id: 'egg', name: '蛋', emoji: '🥚', color: '#f4d35e' },
  { id: 'noodle', name: '麵', emoji: '🍜', color: '#e09a4b' },
  { id: 'spam', name: '午餐肉', emoji: '🥓', color: '#e07a6a' },
  { id: 'dough', name: '麵餅', emoji: '🫓', color: '#f0d2b0' },
  { id: 'sauce', name: '茄汁', emoji: '🥫', color: '#b3322c' },
  { id: 'pepperoni', name: '辣肉腸', emoji: '🌭', color: '#d35400' },
  { id: 'pineapple', name: '菠蘿', emoji: '🍍', color: '#d6b31e' },
  { id: 'onion', name: '洋蔥', emoji: '🧅', color: '#c9a0dc' },
  { id: 'mushroom', name: '蘑菇', emoji: '🍄', color: '#8d6e63' },
  { id: 'pepper', name: '青椒', emoji: '🫑', color: '#3d9a4a' },
  { id: 'shrimp', name: '蝦', emoji: '🦐', color: '#ff8f8f' },
  { id: 'chicken', name: '雞肉', emoji: '🍗', color: '#e8a15a' },
  { id: 'tofu', name: '豆腐', emoji: '🧈', color: '#f4efe4' },
  { id: 'corn', name: '玉米', emoji: '🌽', color: '#f6d423' },
  { id: 'ham', name: '火腿', emoji: '🍖', color: '#d96c6c' },
  { id: 'cabbage', name: '白菜', emoji: '🥬', color: '#7dcea0' },
  { id: 'fish', name: '魚', emoji: '🐟', color: '#5dade2' },
  { id: 'garlic', name: '蒜', emoji: '🧄', color: '#f4e8c1' },
  { id: 'chili', name: '辣椒', emoji: '🌶️', color: '#e53935' },
  { id: 'milk', name: '牛奶', emoji: '🥛', color: '#d6eaf8' },
  { id: 'butter', name: '牛油', emoji: '🧈', color: '#ffe08a' },
  { id: 'potato', name: '薯仔', emoji: '🥔', color: '#c4a484' },
  { id: 'lettuce', name: '生菜', emoji: '🥗', color: '#8bc34a' },
  { id: 'peas', name: '青豆', emoji: '🟢', color: '#43a047' },
  { id: 'crab', name: '蟹', emoji: '🦀', color: '#ff7043' },
  { id: 'beef', name: '牛扒', emoji: '🥩', color: '#8d4a3a' },
  { id: 'eggplant', name: '茄子', emoji: '🍆', color: '#7e57c2' },
  { id: 'pineapplebun', name: '菠蘿包', emoji: '🍞', color: '#e7b07a' },
  { id: 'bread', name: '麵包', emoji: '🥪', color: '#f0d2a0' },
  { id: 'peanutbutter', name: '花生醬', emoji: '🥜', color: '#c48a3a' },
  { id: 'bacon', name: '煙肉', emoji: '🥓', color: '#d36a6a' },
  { id: 'macaroni', name: '通粉', emoji: '🍝', color: '#f2d48a' },
  { id: 'tea', name: '紅茶', emoji: '🍵', color: '#8d4a32' },
  { id: 'evap', name: '淡奶', emoji: '🥛', color: '#f7f1e4' },
  { id: 'coffee', name: '咖啡', emoji: '☕', color: '#6b3e2e' },
  { id: 'lemon', name: '檸檬', emoji: '🍋', color: '#f2d04b' },
  { id: 'tart', name: '撻皮', emoji: '🥧', color: '#e2b07a' },
  { id: 'coconut', name: '椰汁', emoji: '🥥', color: '#f4efe4' },
  { id: 'curry', name: '咖喱', emoji: '🍛', color: '#e09a20' },
  { id: 'wing', name: '雞翼', emoji: '🪽', color: '#d9894a' },
  { id: 'peppercorn', name: '黑椒', emoji: '⚫', color: '#3a342f' },
  { id: 'fillet', name: '魚柳', emoji: '🐟', color: '#7eb6d6' },
  { id: 'bun', name: '餐包', emoji: '🍔', color: '#e6c48a' },
  { id: 'squid', name: '鮮魷', emoji: '🦑', color: '#e7b7c8' },
  { id: 'cream', name: '忌廉', emoji: '🍨', color: '#fff6ea' },
  { id: 'spaghetti', name: '意粉', emoji: '🍝', color: '#f0c36a' },
  { id: 'charsiu', name: '叉燒', emoji: '🍖', color: '#c4473a' },
  { id: 'duck', name: '燒鴨', emoji: '🦆', color: '#8d4a32' },
  { id: 'ginger', name: '薑', emoji: '🫚', color: '#e6c07a' },
  { id: 'scallion', name: '蔥', emoji: '🌿', color: '#5fa36a' },
  { id: 'cucumber', name: '青瓜', emoji: '🥒', color: '#6aaa4a' },
  { id: 'hofun', name: '河粉', emoji: '🍜', color: '#f3e2b8' },
  { id: 'sprout', name: '芽菜', emoji: '🌱', color: '#b7d36a' },
  { id: 'vermicelli', name: '米粉', emoji: '🍜', color: '#f7e7c4' },
  { id: 'mince', name: '豬肉', emoji: '🥩', color: '#d4897a' },
  { id: 'skin', name: '麵皮', emoji: '🥟', color: '#f6e3c4' },
  { id: 'radish', name: '白蘿蔔', emoji: '⚪', color: '#f4f0e6' },
  { id: 'chuhou', name: '柱侯醬', emoji: '🥫', color: '#8a3b22' },
  { id: 'fishball', name: '魚蛋', emoji: '🍥', color: '#f7d6c8' },
  { id: 'beefball', name: '牛丸', emoji: '🟤', color: '#8d4a3a' },
  { id: 'choisum', name: '菜心', emoji: '🥬', color: '#3e9a4a' },
  { id: 'century', name: '皮蛋', emoji: '🖤', color: '#3a3a3a' },
  { id: 'congee', name: '粥', emoji: '🥣', color: '#f3e6c8' },
  { id: 'liver', name: '豬潤', emoji: '🟤', color: '#9a3d45' },
  { id: 'peanut', name: '花生', emoji: '🥜', color: '#d7a15a' },
  { id: 'rib', name: '排骨', emoji: '🍖', color: '#c46a4a' },
  { id: 'blackbean', name: '豆豉', emoji: '🫘', color: '#4a3428' },
  { id: 'belly', name: '五花肉', emoji: '🥓', color: '#e09a8a' },
  { id: 'mui', name: '梅菜', emoji: '🥬', color: '#6a7a3a' },
  { id: 'soy', name: '豉油', emoji: '🍶', color: '#5a2e1c' },
  { id: 'lapcheong', name: '臘腸', emoji: '🌭', color: '#b43838' },
  { id: 'mango', name: '芒果', emoji: '🥭', color: '#f0b429' },
  { id: 'pomelo', name: '柚子', emoji: '🍊', color: '#f2c14b' },
  { id: 'sago', name: '西米', emoji: '⚪', color: '#f7f4ee' },
  { id: 'flour', name: '粘米粉', emoji: '🌾', color: '#f3e6c0' },
  { id: 'driedshrimp', name: '蝦米', emoji: '🦐', color: '#e07a6a' },
];

export const RECIPES: Recipe[] = [
  { id: 'pork-rice', name: '焗豬扒飯', emoji: '🍱', kind: 'cafe', ingredientIds: ['tomato', 'pork', 'cheese', 'rice'] },
  { id: 'spam-noodle', name: '餐蛋麵', emoji: '🍜', kind: 'cafe', ingredientIds: ['egg', 'noodle', 'spam'] },
  { id: 'spam-rice', name: '餐蛋飯', emoji: '🍱', kind: 'cafe', ingredientIds: ['spam', 'egg', 'rice'] },
  { id: 'pineapple-butter', name: '菠蘿油', emoji: '🍞', kind: 'cafe', ingredientIds: ['pineapplebun', 'butter'] },
  { id: 'french-toast', name: '西多士', emoji: '🍞', kind: 'cafe', ingredientIds: ['bread', 'egg', 'peanutbutter'] },
  { id: 'ham-egg-toast', name: '火腿蛋多士', emoji: '🥪', kind: 'cafe', ingredientIds: ['bread', 'ham', 'egg'] },
  { id: 'bacon-egg-toast', name: '煙肉蛋多士', emoji: '🥪', kind: 'cafe', ingredientIds: ['bread', 'bacon', 'egg'] },
  { id: 'ham-macaroni', name: '火腿通粉', emoji: '🍝', kind: 'cafe', ingredientIds: ['macaroni', 'ham', 'egg'] },
  { id: 'milk-tea', name: '奶茶', emoji: '🧋', kind: 'cafe', ingredientIds: ['tea', 'evap'] },
  { id: 'yuenyeung', name: '鴛鴦', emoji: '☕', kind: 'cafe', ingredientIds: ['coffee', 'tea', 'evap'] },
  { id: 'lemon-tea', name: '凍檸茶', emoji: '🍋', kind: 'cafe', ingredientIds: ['tea', 'lemon'] },
  { id: 'egg-tart', name: '蛋撻', emoji: '🥧', kind: 'cafe', ingredientIds: ['tart', 'egg', 'milk'] },
  { id: 'portuguese-chicken', name: '葡國雞', emoji: '🍛', kind: 'cafe', ingredientIds: ['chicken', 'potato', 'coconut', 'curry', 'rice'] },
  { id: 'swiss-wing', name: '瑞士雞翼', emoji: '🍗', kind: 'cafe', ingredientIds: ['wing', 'ham', 'cheese'] },
  { id: 'pepper-beef-rice', name: '黑椒牛柳飯', emoji: '🍱', kind: 'cafe', ingredientIds: ['beef', 'peppercorn', 'rice', 'onion'] },
  { id: 'tomato-pork-rice', name: '茄汁豬扒飯', emoji: '🍱', kind: 'cafe', ingredientIds: ['pork', 'sauce', 'rice'] },
  { id: 'borscht', name: '羅宋湯', emoji: '🍲', kind: 'cafe', ingredientIds: ['tomato', 'beef', 'potato', 'cabbage', 'onion'] },
  { id: 'pizza', name: '薄餅', emoji: '🍕', kind: 'western', ingredientIds: ['dough', 'sauce', 'cheese', 'pepperoni', 'pineapple'] },
  { id: 'bolognese', name: '肉醬意粉', emoji: '🍝', kind: 'western', ingredientIds: ['spaghetti', 'beef', 'sauce'] },
  { id: 'cream-pasta', name: '白汁意粉', emoji: '🍝', kind: 'western', ingredientIds: ['spaghetti', 'mushroom', 'cream'] },
  { id: 'fish-chips', name: '炸魚薯條', emoji: '🍟', kind: 'western', ingredientIds: ['fillet', 'potato'] },
  { id: 'burger', name: '漢堡包', emoji: '🍔', kind: 'western', ingredientIds: ['bun', 'beef', 'lettuce', 'cheese'] },
  { id: 'baked-seafood-rice', name: '焗海鮮飯', emoji: '🍱', kind: 'western', ingredientIds: ['rice', 'shrimp', 'squid', 'cheese'] },
  { id: 'mushroom-soup', name: '奶油蘑菇湯', emoji: '🥣', kind: 'western', ingredientIds: ['mushroom', 'cream', 'milk'] },
  { id: 'corn-soup', name: '粟米濃湯', emoji: '🥣', kind: 'western', ingredientIds: ['corn', 'cream', 'milk'] },
  { id: 'sirloin', name: '西冷牛排', emoji: '🥩', kind: 'western', ingredientIds: ['beef', 'potato', 'mushroom'] },
  { id: 'baked-potato', name: '焗薯', emoji: '🥔', kind: 'western', ingredientIds: ['potato', 'cheese', 'butter'] },
  { id: 'charsiu-rice', name: '叉燒飯', emoji: '🍱', kind: 'chinese', ingredientIds: ['charsiu', 'rice'] },
  { id: 'duck-rice', name: '燒鴨飯', emoji: '🍱', kind: 'chinese', ingredientIds: ['duck', 'rice'] },
  { id: 'white-chicken', name: '白切雞', emoji: '🍗', kind: 'chinese', ingredientIds: ['chicken', 'ginger', 'scallion'] },
  { id: 'hainan-chicken', name: '海南雞飯', emoji: '🍱', kind: 'chinese', ingredientIds: ['chicken', 'rice', 'ginger', 'chili', 'cucumber'] },
  { id: 'beef-hofun', name: '乾炒牛河', emoji: '🍜', kind: 'chinese', ingredientIds: ['beef', 'hofun', 'sprout', 'scallion'] },
  { id: 'singapore-noodle', name: '星洲炒米', emoji: '🍜', kind: 'chinese', ingredientIds: ['vermicelli', 'shrimp', 'charsiu', 'curry', 'pepper'] },
  { id: 'yeungchow', name: '揚州炒飯', emoji: '🍚', kind: 'chinese', ingredientIds: ['rice', 'egg', 'shrimp', 'charsiu', 'peas'] },
  { id: 'wonton-noodle', name: '雲吞麵', emoji: '🍜', kind: 'chinese', ingredientIds: ['shrimp', 'mince', 'noodle', 'skin'] },
  { id: 'brisket-noodle', name: '牛腩麵', emoji: '🍜', kind: 'chinese', ingredientIds: ['beef', 'noodle', 'radish', 'chuhou'] },
  { id: 'cart-noodle', name: '車仔麵', emoji: '🍜', kind: 'chinese', ingredientIds: ['noodle', 'fishball', 'beefball', 'choisum', 'radish'] },
  { id: 'century-congee', name: '皮蛋瘦肉粥', emoji: '🥣', kind: 'chinese', ingredientIds: ['century', 'mince', 'congee'] },
  { id: 'jidi-congee', name: '及第粥', emoji: '🥣', kind: 'chinese', ingredientIds: ['mince', 'liver', 'fish', 'congee'] },
  { id: 'sampan-congee', name: '艇仔粥', emoji: '🥣', kind: 'chinese', ingredientIds: ['fish', 'squid', 'peanut', 'congee'] },
  { id: 'har-gow', name: '蝦餃', emoji: '🥟', kind: 'chinese', ingredientIds: ['shrimp', 'skin'] },
  { id: 'siu-mai', name: '燒賣', emoji: '🥟', kind: 'chinese', ingredientIds: ['mince', 'shrimp', 'skin'] },
  { id: 'blackbean-rib', name: '豉汁排骨', emoji: '🍖', kind: 'chinese', ingredientIds: ['rib', 'blackbean', 'garlic'] },
  { id: 'mui-pork', name: '梅菜扣肉', emoji: '🍖', kind: 'chinese', ingredientIds: ['belly', 'mui'] },
  { id: 'sweet-sour-pork', name: '咕嚕肉', emoji: '🍖', kind: 'chinese', ingredientIds: ['mince', 'pineapple', 'pepper', 'sauce'] },
  { id: 'kungpao', name: '宮保雞丁', emoji: '🍗', kind: 'chinese', ingredientIds: ['chicken', 'peanut', 'chili', 'pepper'] },
  { id: 'mapo', name: '麻婆豆腐', emoji: '🧈', kind: 'chinese', ingredientIds: ['tofu', 'mince', 'chili', 'garlic'] },
  { id: 'yuxiang-eggplant', name: '魚香茄子', emoji: '🍆', kind: 'chinese', ingredientIds: ['eggplant', 'mince', 'garlic', 'chili'] },
  { id: 'steamed-fish', name: '清蒸魚', emoji: '🐟', kind: 'chinese', ingredientIds: ['fish', 'ginger', 'scallion', 'soy'] },
  { id: 'ginger-crab', name: '薑蔥炒蟹', emoji: '🦀', kind: 'chinese', ingredientIds: ['crab', 'ginger', 'scallion'] },
  { id: 'claypot', name: '煲仔飯', emoji: '🍚', kind: 'chinese', ingredientIds: ['rice', 'lapcheong', 'rib', 'egg'] },
  { id: 'mango-pomelo', name: '楊枝甘露', emoji: '🥭', kind: 'chinese', ingredientIds: ['mango', 'pomelo', 'sago', 'coconut'] },
  { id: 'tomato-egg', name: '番茄炒蛋', emoji: '🍅', kind: 'chinese', ingredientIds: ['tomato', 'egg'] },
  { id: 'radish-cake', name: '蘿蔔糕', emoji: '⬜', kind: 'chinese', ingredientIds: ['radish', 'flour', 'lapcheong', 'driedshrimp'] },
];

const BY_ID = new Map(INGREDIENTS.map((item) => [item.id, item]));

export function ingredientById(id: string) {
  const found = BY_ID.get(id);
  if (!found) throw new Error(`unknown ingredient ${id}`);
  return found;
}

export function recipeById(id: string) {
  const found = RECIPES.find((recipe) => recipe.id === id);
  if (!found) throw new Error(`unknown recipe ${id}`);
  return found;
}

export const ALL_INGREDIENT_IDS = INGREDIENTS.map((item) => item.id);
