import type { LocalizedText } from '@lo2ma/core';

export interface FoodFacts {
  name: LocalizedText;
  /** Per 100 g, from USDA FoodData Central and Egypt's food composition tables, rounded. */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** How much kitchens' portions of it vary, as a share: oil and sauces vary the most. */
  spread: number;
}

const food = (
  ar: string,
  en: string,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  spread: number,
): FoodFacts => ({ name: { ar, en }, kcal, protein, carbs, fat, spread });

/**
 * The short list of foods the estimate may use (C-lite): the model only picks from it, and the numbers are ours.
 * The real one lives in the backend's database from phase 2.
 */
export const foods = {
  baladiBread: food('عيش بلدي', 'Baladi bread', 265, 9.8, 55, 2.6, 0.15),
  whiteBread: food('عيش فينو', 'White bread', 265, 9, 49, 3.3, 0.1),
  rice: food('رز أبيض مطبوخ', 'Cooked white rice', 130, 2.7, 28, 0.3, 0.2),
  pasta: food('مكرونة مسلوقة', 'Cooked pasta', 158, 5.8, 31, 0.9, 0.2),
  lentils: food('عدس مطبوخ', 'Cooked lentils', 116, 9, 20, 0.4, 0.2),
  chickpeas: food('حمص مسلوق', 'Cooked chickpeas', 164, 8.9, 27, 2.6, 0.2),
  foul: food('فول مدمس', 'Stewed fava beans', 110, 7.6, 19.7, 0.4, 0.2),
  taameya: food('طعمية', 'Taameya', 333, 13.3, 31.8, 17.8, 0.25),
  friedOnions: food('بصل مقلي', 'Fried onions', 420, 4, 40, 27, 0.4),
  tomatoSauce: food('صلصة طماطم', 'Tomato sauce', 60, 1.4, 8, 2.5, 0.3),
  egg: food('بيض', 'Egg', 155, 13, 1.1, 11, 0.15),
  kofta: food('كفتة لحمة', 'Beef kofta', 245, 20, 4, 16.5, 0.15),
  kebab: food('لحمة مشوية', 'Grilled beef', 215, 28, 0, 11, 0.15),
  beefShawarma: food('شاورما لحمة', 'Beef shawarma', 230, 24, 3, 14, 0.2),
  liver: food('كبدة', 'Beef liver', 200, 25, 6, 8, 0.2),
  sausage: food('سجق', 'Sausage', 300, 13, 3, 26, 0.2),
  chicken: food('فراخ مشوية', 'Grilled chicken', 215, 25, 0, 12, 0.15),
  chickenBreast: food('صدور فراخ', 'Chicken breast', 165, 31, 0, 3.6, 0.15),
  chickenPane: food('فراخ بانيه', 'Breaded chicken', 260, 18, 14, 15, 0.2),
  tilapia: food('سمك بلطي', 'Tilapia', 128, 26, 0, 2.7, 0.15),
  shrimp: food('جمبري مقلي', 'Fried shrimp', 242, 21, 11.5, 12.3, 0.2),
  fishFillet: food('فيليه سمك', 'Fish fillet', 105, 23, 0, 1.2, 0.15),
  tuna: food('تونة', 'Tuna', 198, 29, 0, 8.2, 0.15),
  cheese: food('جبنة', 'Cheese', 300, 20, 2, 24, 0.2),
  yogurt: food('زبادي', 'Yogurt', 61, 3.5, 4.7, 3.3, 0.15),
  milk: food('لبن', 'Milk', 61, 3.2, 4.8, 3.3, 0.15),
  fruit: food('فاكهة', 'Fruit', 55, 0.7, 14, 0.2, 0.2),
  vegetables: food('خضار', 'Vegetables', 25, 1.2, 5, 0.2, 0.3),
  cookedVegetables: food('خضار مطبوخ', 'Cooked vegetables', 90, 2, 9, 5, 0.3),
  tahini: food('طحينة', 'Tahini sauce', 300, 8.5, 10, 26, 0.3),
  garlicSauce: food('ثومية', 'Garlic sauce', 600, 1, 4, 64, 0.3),
  coleslaw: food('كول سلو', 'Coleslaw', 150, 1, 13, 11, 0.25),
  oil: food('زيت', 'Oil', 884, 0, 0, 100, 0.4),
  ghee: food('سمنة', 'Ghee', 876, 0.3, 0, 99, 0.4),
  fries: food('بطاطس محمرة', 'Fries', 312, 3.4, 41, 15, 0.2),
  quinoa: food('كينوا مطبوخة', 'Cooked quinoa', 120, 4.4, 21, 1.9, 0.2),
  pizzaDough: food('عجينة بيتزا', 'Pizza dough', 270, 9, 50, 3.5, 0.15),
  burgerPatty: food('برجر لحمة', 'Beef patty', 250, 17, 0, 20, 0.15),
  feteerDough: food('عجينة فطير', 'Feteer dough', 400, 7, 48, 20, 0.2),
  crepe: food('عجينة كريب', 'Crepe', 225, 6, 28, 10, 0.15),
  honey: food('عسل', 'Honey', 304, 0.3, 82, 0, 0.3),
  chocolateSpread: food('شوكولاتة بالبندق', 'Chocolate spread', 540, 6, 58, 31, 0.3),
  ricePudding: food('رز بلبن', 'Rice pudding', 130, 3.6, 22, 3.2, 0.15),
  nuts: food('مكسرات', 'Nuts', 600, 18, 20, 52, 0.3),
  sugar: food('سكر', 'Sugar', 387, 0, 100, 0, 0.3),
  pickles: food('مخلل', 'Pickles', 14, 0.5, 2.5, 0.2, 0.3),
} satisfies Record<string, FoodFacts>;

export type FoodId = keyof typeof foods;

/** A dish's foods and their grams, before they are scaled to the dish's calories. */
export type Recipe = Partial<Record<FoodId, number>>;
