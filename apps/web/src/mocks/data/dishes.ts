import type { Ingredient, LocalizedText } from '@lo2ma/core';
import type { Recipe } from './foods';

export type Cuisine =
  | 'koshari'
  | 'foul'
  | 'grill'
  | 'shawarma'
  | 'chicken'
  | 'seafood'
  | 'healthy'
  | 'pizza'
  | 'burger'
  | 'crepe'
  | 'home'
  | 'feteer'
  | 'hawawshi'
  | 'sandwich';

export interface DishTemplate {
  name: LocalizedText;
  /** Price in EGP before a restaurant's own adjustment. */
  price: number;
  kcal: number;
  /** What it is made of, scaled to `kcal` for the macros and the estimate's range. */
  recipe: Recipe;
  contains: Ingredient[];
  /** Mains can be ordered alone; sides only next to a main. */
  role: 'main' | 'side';
}

const dish = (
  ar: string,
  en: string,
  price: number,
  kcal: number,
  recipe: Recipe,
  contains: Ingredient[] = [],
  role: DishTemplate['role'] = 'main',
): DishTemplate => ({ name: { ar, en }, price, kcal, recipe, contains, role });

const baladiSalad: Recipe = { vegetables: 150, oil: 3 };

/** Typical dishes per cuisine, priced like office lunches in Cairo. */
export const dishesByCuisine: Record<Cuisine, DishTemplate[]> = {
  koshari: [
    dish('كشري كبير', 'Large koshari', 95, 900, {
      rice: 150,
      pasta: 150,
      lentils: 100,
      chickpeas: 30,
      friedOnions: 30,
      tomatoSauce: 150,
      oil: 10,
    }),
    dish('كشري وسط', 'Medium koshari', 70, 650, {
      rice: 105,
      pasta: 105,
      lentils: 70,
      chickpeas: 20,
      friedOnions: 20,
      tomatoSauce: 100,
      oil: 7,
    }),
    dish('رز بلبن', 'Rice pudding', 25, 250, { ricePudding: 200 }, ['dairy'], 'side'),
    dish('سلطة بلدي', 'Baladi salad', 15, 60, baladiSalad, [], 'side'),
  ],
  foul: [
    dish('فول وطعمية وبيض + عيش', 'Foul, taameya & eggs + bread', 100, 650, {
      foul: 200,
      taameya: 60,
      egg: 50,
      baladiBread: 90,
      oil: 5,
    }),
    dish('طبق فول بالزيت الحار + طعمية', 'Foul with hot oil + taameya', 70, 520, {
      foul: 250,
      oil: 15,
      taameya: 60,
    }),
    dish('سلطة بلدي', 'Baladi salad', 15, 60, baladiSalad, [], 'side'),
    dish('بطاطس محمرة', 'Fried potatoes', 25, 320, { fries: 100 }, [], 'side'),
  ],
  grill: [
    dish('كفتة مشوية + رز', 'Grilled kofta + rice', 145, 690, { kofta: 180, rice: 200 }, ['beef']),
    dish('ربع كباب + رز', 'Quarter kebab + rice', 190, 760, { kebab: 200, rice: 200, oil: 5 }, [
      'beef',
    ]),
    dish('طرب + عيش', 'Tarb + bread', 170, 820, { kofta: 220, oil: 10, baladiBread: 90 }, ['beef']),
    dish('سلطة طحينة', 'Tahini salad', 20, 150, { tahini: 50 }, [], 'side'),
  ],
  shawarma: [
    dish(
      'شاورما لحمة + سلطة',
      'Beef shawarma + salad',
      130,
      700,
      { beefShawarma: 180, whiteBread: 80, tahini: 30, vegetables: 80 },
      ['beef'],
    ),
    dish(
      'شاورما فراخ + بطاطس',
      'Chicken shawarma + fries',
      115,
      720,
      { chicken: 160, whiteBread: 80, garlicSauce: 25, fries: 100 },
      ['chicken'],
    ),
    dish(
      'فتة شاورما',
      'Shawarma fatta',
      150,
      920,
      { beefShawarma: 180, rice: 150, baladiBread: 60, yogurt: 60, garlicSauce: 20, ghee: 10 },
      ['beef', 'dairy'],
    ),
    dish('ثومية زيادة', 'Extra garlic sauce', 10, 120, { garlicSauce: 20 }, [], 'side'),
  ],
  chicken: [
    dish(
      'ربع فرخة مشوية + رز',
      'Quarter grilled chicken + rice',
      120,
      650,
      { chicken: 200, rice: 200 },
      ['chicken'],
    ),
    dish(
      'نص فرخة مشوية + رز',
      'Half grilled chicken + rice',
      190,
      950,
      { chicken: 350, rice: 220 },
      ['chicken'],
    ),
    dish('فراخ بانيه + بطاطس', 'Chicken pané + fries', 135, 780, { chickenPane: 180, fries: 120 }, [
      'chicken',
    ]),
    dish('سلطة كول سلو', 'Coleslaw', 20, 140, { coleslaw: 100 }, ['dairy'], 'side'),
  ],
  seafood: [
    dish(
      'بلطي مشوي + رز صيادية',
      'Grilled tilapia + sayadeya rice',
      150,
      620,
      { tilapia: 250, rice: 200, friedOnions: 10, oil: 5 },
      ['fish'],
    ),
    dish('جمبري مقلي + رز', 'Fried shrimp + rice', 240, 680, { shrimp: 180, rice: 200 }, ['fish']),
    dish(
      'سمك فيليه + سلطة',
      'Fish fillet + salad',
      165,
      540,
      { fishFillet: 250, vegetables: 150, oil: 15, baladiBread: 40 },
      ['fish'],
    ),
    dish(
      'شوربة سي فود',
      'Seafood soup',
      60,
      260,
      { fishFillet: 80, shrimp: 30, milk: 150, vegetables: 50 },
      ['fish', 'dairy'],
      'side',
    ),
  ],
  healthy: [
    dish(
      'سلطة تونة + عيش بلدي',
      'Tuna salad + baladi bread',
      120,
      480,
      { tuna: 100, vegetables: 150, baladiBread: 60, oil: 5 },
      ['fish'],
    ),
    dish(
      'سلطة سيزر بالفراخ',
      'Chicken Caesar salad',
      145,
      520,
      { chickenBreast: 150, vegetables: 150, cheese: 20, whiteBread: 30, oil: 10 },
      ['chicken', 'dairy'],
    ),
    dish('بول كينوا وخضار', 'Quinoa & veggie bowl', 135, 450, {
      quinoa: 200,
      vegetables: 150,
      chickpeas: 60,
      oil: 10,
    }),
    dish(
      'زبادي بالفواكه',
      'Yogurt with fruit',
      45,
      220,
      { yogurt: 200, fruit: 120, honey: 15 },
      ['dairy'],
      'side',
    ),
  ],
  pizza: [
    dish(
      'بيتزا مارجريتا وسط',
      'Medium Margherita pizza',
      140,
      880,
      { pizzaDough: 220, cheese: 100, tomatoSauce: 60 },
      ['dairy'],
    ),
    dish(
      'بيتزا خضار وسط',
      'Medium veggie pizza',
      150,
      840,
      { pizzaDough: 220, cheese: 80, vegetables: 100, tomatoSauce: 60 },
      ['dairy'],
    ),
    dish(
      'بيتزا فراخ وسط',
      'Medium chicken pizza',
      170,
      950,
      { pizzaDough: 220, cheese: 90, chickenBreast: 80, tomatoSauce: 60 },
      ['chicken', 'dairy'],
    ),
    dish(
      'أصابع جبنة',
      'Cheese sticks',
      45,
      380,
      { cheese: 60, pizzaDough: 60, oil: 5 },
      ['dairy'],
      'side',
    ),
  ],
  burger: [
    dish(
      'برجر كلاسيك + بطاطس',
      'Classic burger + fries',
      140,
      820,
      { burgerPatty: 150, whiteBread: 80, cheese: 20, fries: 100, vegetables: 30 },
      ['beef', 'dairy'],
    ),
    dish(
      'برجر فراخ كرسبي',
      'Crispy chicken burger',
      130,
      760,
      { chickenPane: 180, whiteBread: 90, garlicSauce: 25, vegetables: 30 },
      ['chicken'],
    ),
    dish(
      'دبل تشيز برجر',
      'Double cheeseburger',
      190,
      1050,
      { burgerPatty: 300, whiteBread: 80, cheese: 40, vegetables: 30 },
      ['beef', 'dairy'],
    ),
    dish('بطاطس بالجبنة', 'Cheese fries', 40, 420, { fries: 100, cheese: 30 }, ['dairy'], 'side'),
  ],
  crepe: [
    dish(
      'كريب فراخ',
      'Chicken crepe',
      110,
      760,
      { crepe: 150, chicken: 100, cheese: 40, vegetables: 30 },
      ['chicken', 'dairy'],
    ),
    dish('كريب سجق', 'Sausage crepe', 105, 800, { crepe: 150, sausage: 100, cheese: 40 }, [
      'beef',
      'dairy',
    ]),
    dish(
      'كريب خضار بالجبنة',
      'Veggie & cheese crepe',
      100,
      640,
      { crepe: 150, cheese: 60, vegetables: 80 },
      ['dairy'],
    ),
    dish(
      'كريب نوتيلا',
      'Nutella crepe',
      90,
      650,
      { crepe: 130, chocolateSpread: 60 },
      ['dairy', 'nuts'],
      'side',
    ),
  ],
  home: [
    dish(
      'ملوخية + فراخ + رز',
      'Molokhia, chicken & rice',
      160,
      850,
      { cookedVegetables: 250, chicken: 180, rice: 180 },
      ['chicken'],
    ),
    dish('محشي مشكل', 'Mixed mahshi', 120, 600, { cookedVegetables: 200, rice: 200, oil: 10 }),
    dish('مسقعة + رز', 'Mesaqaa + rice', 105, 580, { cookedVegetables: 250, rice: 180, oil: 10 }),
    dish(
      'فتة لحمة',
      'Beef fatta',
      175,
      980,
      { kebab: 150, rice: 200, baladiBread: 80, tomatoSauce: 60, ghee: 15 },
      ['beef', 'dairy'],
    ),
  ],
  feteer: [
    dish(
      'فطير مشلتت + عسل وجبنة',
      'Feteer meshaltet with honey & cheese',
      110,
      900,
      { feteerDough: 180, honey: 40, cheese: 50 },
      ['dairy'],
    ),
    dish('فطير سجق', 'Sausage feteer', 130, 950, { feteerDough: 160, sausage: 100, cheese: 40 }, [
      'beef',
      'dairy',
    ]),
    dish(
      'فطير خضار',
      'Veggie feteer',
      105,
      720,
      { feteerDough: 150, vegetables: 100, cheese: 40 },
      ['dairy'],
    ),
    dish(
      'أم علي',
      'Om Ali',
      45,
      450,
      { feteerDough: 60, milk: 150, nuts: 20, sugar: 25 },
      ['dairy', 'nuts'],
      'side',
    ),
  ],
  hawawshi: [
    dish('حواوشي بلدي', 'Baladi hawawshi', 100, 760, { baladiBread: 150, kofta: 150, oil: 10 }, [
      'beef',
    ]),
    dish(
      'حواوشي بالجبنة',
      'Cheese hawawshi',
      115,
      860,
      { baladiBread: 150, kofta: 150, cheese: 40, oil: 10 },
      ['beef', 'dairy'],
    ),
    dish('مخلل', 'Pickles', 10, 20, { pickles: 150 }, [], 'side'),
  ],
  sandwich: [
    dish(
      '3 سندوتشات كبدة إسكندراني',
      '3 Alexandrian liver sandwiches',
      105,
      840,
      { liver: 180, whiteBread: 210, oil: 10, vegetables: 30 },
      ['beef'],
    ),
    dish(
      '3 سندوتشات سجق',
      '3 sausage sandwiches',
      105,
      900,
      { sausage: 180, whiteBread: 210, vegetables: 30 },
      ['beef'],
    ),
    dish('سندوتشات بطاطس وبيض', 'Potato & egg sandwiches', 80, 700, {
      fries: 150,
      egg: 100,
      whiteBread: 150,
    }),
    dish('طحينة', 'Tahini', 10, 90, { tahini: 30 }, [], 'side'),
  ],
};
