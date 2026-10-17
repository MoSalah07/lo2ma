import { fromPounds, type MenuItem, type Restaurant } from '@lo2ma/core';
import { estimateDish } from '../engine/estimate';
import { dishesByCuisine, type Cuisine } from './dishes';

interface RestaurantSeed {
  ar: string;
  en: string;
  cuisine: Cuisine;
  distanceKm: number;
  etaMinutes: number;
  deliveryFee: number;
  /** Multiplies the template prices (cheaper or pricier place), rounded to 5 EGP. */
  priceFactor: number;
  /** Places that publish calories; everywhere else the AI estimates them. */
  publishesCalories?: boolean;
}

// Fictional restaurants around the Smart Village. Any resemblance to a real place is a coincidence.
const seeds: RestaurantSeed[] = [
  {
    ar: 'بيت الكشري',
    en: 'Beit El Koshari',
    cuisine: 'koshari',
    distanceKm: 1.2,
    etaMinutes: 15,
    deliveryFee: 20,
    priceFactor: 1,
  },
  {
    ar: 'مشويات الدار',
    en: 'Mashweyat El Dar',
    cuisine: 'grill',
    distanceKm: 2.1,
    etaMinutes: 20,
    deliveryFee: 20,
    priceFactor: 1,
  },
  {
    ar: 'سلطات خضرا',
    en: 'Salatat Khadra',
    cuisine: 'healthy',
    distanceKm: 0.8,
    etaMinutes: 12,
    deliveryFee: 15,
    priceFactor: 1,
    publishesCalories: true,
  },
  {
    ar: 'شاورما الركن',
    en: 'Shawerma El Rokn',
    cuisine: 'shawarma',
    distanceKm: 1.6,
    etaMinutes: 18,
    deliveryFee: 20,
    priceFactor: 1,
  },
  {
    ar: 'فول وفلافل الحارة',
    en: 'El Hara Foul & Falafel',
    cuisine: 'foul',
    distanceKm: 0.9,
    etaMinutes: 10,
    deliveryFee: 15,
    priceFactor: 0.9,
  },
  {
    ar: 'كشري الزعيم',
    en: 'Koshari El Zaeem',
    cuisine: 'koshari',
    distanceKm: 2.8,
    etaMinutes: 22,
    deliveryFee: 25,
    priceFactor: 0.9,
  },
  {
    ar: 'مطبخ ستي',
    en: 'Matbakh Setty',
    cuisine: 'home',
    distanceKm: 1.9,
    etaMinutes: 25,
    deliveryFee: 20,
    priceFactor: 1,
  },
  {
    ar: 'فطاطري الأمير',
    en: 'Fatatri El Amir',
    cuisine: 'feteer',
    distanceKm: 2.4,
    etaMinutes: 25,
    deliveryFee: 20,
    priceFactor: 1,
  },
  {
    ar: 'حواوشي الشلة',
    en: 'Hawawshi El Shella',
    cuisine: 'hawawshi',
    distanceKm: 1.4,
    etaMinutes: 20,
    deliveryFee: 20,
    priceFactor: 1,
  },
  {
    ar: 'كبدة المحطة',
    en: 'El Mahatta Liver',
    cuisine: 'sandwich',
    distanceKm: 1.1,
    etaMinutes: 12,
    deliveryFee: 15,
    priceFactor: 1,
  },
  {
    ar: 'فراخ الفلاح',
    en: 'Ferakh El Fallah',
    cuisine: 'chicken',
    distanceKm: 2.0,
    etaMinutes: 20,
    deliveryFee: 20,
    priceFactor: 1,
  },
  {
    ar: 'سمك البحر',
    en: 'Samak El Bahr',
    cuisine: 'seafood',
    distanceKm: 3.2,
    etaMinutes: 30,
    deliveryFee: 30,
    priceFactor: 1.1,
  },
  {
    ar: 'بيتزا السطوح',
    en: 'Rooftop Pizza',
    cuisine: 'pizza',
    distanceKm: 1.7,
    etaMinutes: 25,
    deliveryFee: 20,
    priceFactor: 1,
  },
  {
    ar: 'برجر الحي',
    en: 'Burger El Hay',
    cuisine: 'burger',
    distanceKm: 1.3,
    etaMinutes: 18,
    deliveryFee: 20,
    priceFactor: 1,
  },
  {
    ar: 'كريب وبس',
    en: 'Just Crepe',
    cuisine: 'crepe',
    distanceKm: 0.7,
    etaMinutes: 12,
    deliveryFee: 15,
    priceFactor: 0.95,
  },
  {
    ar: 'الطبق الأخضر',
    en: 'Green Plate',
    cuisine: 'healthy',
    distanceKm: 2.6,
    etaMinutes: 22,
    deliveryFee: 25,
    priceFactor: 1.1,
    publishesCalories: true,
  },
  {
    ar: 'مشويات الكرمة',
    en: 'El Karma Grill',
    cuisine: 'grill',
    distanceKm: 3.0,
    etaMinutes: 28,
    deliveryFee: 25,
    priceFactor: 1.1,
  },
  {
    ar: 'شاورما السلطان',
    en: 'Sultan Shawerma',
    cuisine: 'shawarma',
    distanceKm: 2.2,
    etaMinutes: 20,
    deliveryFee: 20,
    priceFactor: 0.95,
  },
  {
    ar: 'طعمية أم حسن',
    en: 'Om Hassan Taameya',
    cuisine: 'foul',
    distanceKm: 1.5,
    etaMinutes: 14,
    deliveryFee: 15,
    priceFactor: 1,
  },
  {
    ar: 'كشري الحلو',
    en: 'Koshari El Helw',
    cuisine: 'koshari',
    distanceKm: 1.8,
    etaMinutes: 16,
    deliveryFee: 20,
    priceFactor: 1.05,
  },
  {
    ar: 'بيت المحشي',
    en: 'Beit El Mahshi',
    cuisine: 'home',
    distanceKm: 2.7,
    etaMinutes: 26,
    deliveryFee: 25,
    priceFactor: 0.95,
  },
  {
    ar: 'سندوتشات الميدان',
    en: 'El Midan Sandwiches',
    cuisine: 'sandwich',
    distanceKm: 0.6,
    etaMinutes: 10,
    deliveryFee: 15,
    priceFactor: 0.95,
  },
  {
    ar: 'بولز',
    en: 'Bowls Co.',
    cuisine: 'healthy',
    distanceKm: 1.0,
    etaMinutes: 15,
    deliveryFee: 20,
    priceFactor: 1.15,
    publishesCalories: true,
  },
  {
    ar: 'فراخ الواحة',
    en: 'El Waha Chicken',
    cuisine: 'chicken',
    distanceKm: 1.5,
    etaMinutes: 18,
    deliveryFee: 20,
    priceFactor: 0.95,
  },
  {
    ar: 'أسماك الإسكندراني',
    en: 'El Eskandarani Fish',
    cuisine: 'seafood',
    distanceKm: 2.9,
    etaMinutes: 28,
    deliveryFee: 25,
    priceFactor: 1,
  },
  {
    ar: 'بيتزا ونار',
    en: 'Pizza w Nar',
    cuisine: 'pizza',
    distanceKm: 2.3,
    etaMinutes: 24,
    deliveryFee: 20,
    priceFactor: 0.95,
  },
  {
    ar: 'سماش كورنر',
    en: 'Smash Corner',
    cuisine: 'burger',
    distanceKm: 2.5,
    etaMinutes: 22,
    deliveryFee: 25,
    priceFactor: 1.1,
  },
  {
    ar: 'كريب الجامعة',
    en: 'Uni Crepe',
    cuisine: 'crepe',
    distanceKm: 1.9,
    etaMinutes: 18,
    deliveryFee: 20,
    priceFactor: 0.9,
  },
  {
    ar: 'مطبخ نونا',
    en: "Nona's Kitchen",
    cuisine: 'home',
    distanceKm: 1.2,
    etaMinutes: 20,
    deliveryFee: 20,
    priceFactor: 1.05,
  },
  {
    ar: 'فطير وعسل',
    en: 'Feteer w Asal',
    cuisine: 'feteer',
    distanceKm: 1.6,
    etaMinutes: 22,
    deliveryFee: 20,
    priceFactor: 0.95,
  },
];

const roundTo5 = (pounds: number) => Math.round(pounds / 5) * 5;

export const restaurants: Restaurant[] = seeds.map((seed, index) => ({
  id: `r${String(index + 1).padStart(2, '0')}`,
  name: { ar: seed.ar, en: seed.en },
  distanceKm: seed.distanceKm,
  etaMinutes: seed.etaMinutes,
  deliveryFee: fromPounds(seed.deliveryFee),
}));

export const menu: (MenuItem & { role: 'main' | 'side' })[] = seeds.flatMap((seed, index) => {
  const restaurantId = restaurants[index]?.id ?? '';
  return dishesByCuisine[seed.cuisine].map((template, dishIndex) => {
    const { kcalRange, macros } = estimateDish(template.recipe, template.kcal);
    return {
      id: `${restaurantId}-m${dishIndex + 1}`,
      restaurantId,
      name: template.name,
      price: fromPounds(Math.max(10, roundTo5(template.price * seed.priceFactor))),
      kcal: template.kcal,
      // A place that publishes its calories publishes the macros with them, and they are exact.
      ...(seed.publishesCalories
        ? { kcalSource: 'restaurant' as const }
        : { kcalSource: 'ai' as const, kcalRange }),
      macros,
      contains: template.contains,
      role: template.role,
    };
  });
});

export const restaurantById = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]));
