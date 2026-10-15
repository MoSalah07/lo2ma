import type { Ingredient, LocalizedText } from '@lo2ma/core';

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
  contains: Ingredient[];
  /** Mains can be ordered alone; sides only next to a main. */
  role: 'main' | 'side';
}

const dish = (
  ar: string,
  en: string,
  price: number,
  kcal: number,
  contains: Ingredient[] = [],
  role: DishTemplate['role'] = 'main',
): DishTemplate => ({ name: { ar, en }, price, kcal, contains, role });

/** Typical dishes per cuisine, priced like office lunches in Cairo. */
export const dishesByCuisine: Record<Cuisine, DishTemplate[]> = {
  koshari: [
    dish('كشري كبير', 'Large koshari', 95, 900),
    dish('كشري وسط', 'Medium koshari', 70, 650),
    dish('رز بلبن', 'Rice pudding', 25, 250, ['dairy'], 'side'),
    dish('سلطة بلدي', 'Baladi salad', 15, 60, [], 'side'),
  ],
  foul: [
    dish('فول وطعمية وبيض + عيش', 'Foul, taameya & eggs + bread', 100, 650),
    dish('طبق فول بالزيت الحار + طعمية', 'Foul with hot oil + taameya', 70, 520),
    dish('سلطة بلدي', 'Baladi salad', 15, 60, [], 'side'),
    dish('بطاطس محمرة', 'Fried potatoes', 25, 320, [], 'side'),
  ],
  grill: [
    dish('كفتة مشوية + رز', 'Grilled kofta + rice', 145, 690, ['beef']),
    dish('ربع كباب + رز', 'Quarter kebab + rice', 190, 760, ['beef']),
    dish('طرب + عيش', 'Tarb + bread', 170, 820, ['beef']),
    dish('سلطة طحينة', 'Tahini salad', 20, 150, [], 'side'),
  ],
  shawarma: [
    dish('شاورما لحمة + سلطة', 'Beef shawarma + salad', 130, 700, ['beef']),
    dish('شاورما فراخ + بطاطس', 'Chicken shawarma + fries', 115, 720, ['chicken']),
    dish('فتة شاورما', 'Shawarma fatta', 150, 920, ['beef', 'dairy']),
    dish('ثومية زيادة', 'Extra garlic sauce', 10, 120, [], 'side'),
  ],
  chicken: [
    dish('ربع فرخة مشوية + رز', 'Quarter grilled chicken + rice', 120, 650, ['chicken']),
    dish('نص فرخة مشوية + رز', 'Half grilled chicken + rice', 190, 950, ['chicken']),
    dish('فراخ بانيه + بطاطس', 'Chicken pané + fries', 135, 780, ['chicken']),
    dish('سلطة كول سلو', 'Coleslaw', 20, 140, ['dairy'], 'side'),
  ],
  seafood: [
    dish('بلطي مشوي + رز صيادية', 'Grilled tilapia + sayadeya rice', 150, 620, ['fish']),
    dish('جمبري مقلي + رز', 'Fried shrimp + rice', 240, 680, ['fish']),
    dish('سمك فيليه + سلطة', 'Fish fillet + salad', 165, 540, ['fish']),
    dish('شوربة سي فود', 'Seafood soup', 60, 260, ['fish', 'dairy'], 'side'),
  ],
  healthy: [
    dish('سلطة تونة + عيش بلدي', 'Tuna salad + baladi bread', 120, 480, ['fish']),
    dish('سلطة سيزر بالفراخ', 'Chicken Caesar salad', 145, 520, ['chicken', 'dairy']),
    dish('بول كينوا وخضار', 'Quinoa & veggie bowl', 135, 450),
    dish('زبادي بالفواكه', 'Yogurt with fruit', 45, 220, ['dairy'], 'side'),
  ],
  pizza: [
    dish('بيتزا مارجريتا وسط', 'Medium Margherita pizza', 140, 880, ['dairy']),
    dish('بيتزا خضار وسط', 'Medium veggie pizza', 150, 840, ['dairy']),
    dish('بيتزا فراخ وسط', 'Medium chicken pizza', 170, 950, ['chicken', 'dairy']),
    dish('أصابع جبنة', 'Cheese sticks', 45, 380, ['dairy'], 'side'),
  ],
  burger: [
    dish('برجر كلاسيك + بطاطس', 'Classic burger + fries', 140, 820, ['beef', 'dairy']),
    dish('برجر فراخ كرسبي', 'Crispy chicken burger', 130, 760, ['chicken']),
    dish('دبل تشيز برجر', 'Double cheeseburger', 190, 1050, ['beef', 'dairy']),
    dish('بطاطس بالجبنة', 'Cheese fries', 40, 420, ['dairy'], 'side'),
  ],
  crepe: [
    dish('كريب فراخ', 'Chicken crepe', 110, 760, ['chicken', 'dairy']),
    dish('كريب سجق', 'Sausage crepe', 105, 800, ['beef', 'dairy']),
    dish('كريب خضار بالجبنة', 'Veggie & cheese crepe', 100, 640, ['dairy']),
    dish('كريب نوتيلا', 'Nutella crepe', 90, 650, ['dairy', 'nuts'], 'side'),
  ],
  home: [
    dish('ملوخية + فراخ + رز', 'Molokhia, chicken & rice', 160, 850, ['chicken']),
    dish('محشي مشكل', 'Mixed mahshi', 120, 600),
    dish('مسقعة + رز', 'Mesaqaa + rice', 105, 580),
    dish('فتة لحمة', 'Beef fatta', 175, 980, ['beef', 'dairy']),
  ],
  feteer: [
    dish('فطير مشلتت + عسل وجبنة', 'Feteer meshaltet with honey & cheese', 110, 900, ['dairy']),
    dish('فطير سجق', 'Sausage feteer', 130, 950, ['beef', 'dairy']),
    dish('فطير خضار', 'Veggie feteer', 105, 720, ['dairy']),
    dish('أم علي', 'Om Ali', 45, 450, ['dairy', 'nuts'], 'side'),
  ],
  hawawshi: [
    dish('حواوشي بلدي', 'Baladi hawawshi', 100, 760, ['beef']),
    dish('حواوشي بالجبنة', 'Cheese hawawshi', 115, 860, ['beef', 'dairy']),
    dish('مخلل', 'Pickles', 10, 20, [], 'side'),
  ],
  sandwich: [
    dish('3 سندوتشات كبدة إسكندراني', '3 Alexandrian liver sandwiches', 105, 840, ['beef']),
    dish('3 سندوتشات سجق', '3 sausage sandwiches', 105, 900, ['beef']),
    dish('سندوتشات بطاطس وبيض', 'Potato & egg sandwiches', 80, 700),
    dish('طحينة', 'Tahini', 10, 90, [], 'side'),
  ],
};
