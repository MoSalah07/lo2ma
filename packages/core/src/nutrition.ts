import { formats } from '@lo2ma/i18n/formats';
import type { Locale } from '@lo2ma/i18n/locales';
import { fillTemplate, formatNumber } from './number.ts';
import type { CalorieSource, KcalRange, Macros, MenuItem } from './schemas/food.ts';

/** A dish as it sits in a meal: its nutrition and how many of it. */
export type Portion = Pick<MenuItem, 'kcal' | 'kcalSource' | 'kcalRange' | 'macros'> & {
  quantity: number;
};

export interface MealNutrition {
  kcal: number;
  kcalSource: CalorieSource;
  /** Present when kcalSource is "ai". */
  kcalRange?: KcalRange;
  macros: Macros;
}

/**
 * Adds up a meal's dishes. One estimated dish makes the whole meal an estimate, and its range counts the
 * published dishes as exact.
 */
export function mealNutrition(portions: readonly Portion[]): MealNutrition {
  const total = { kcal: 0, low: 0, high: 0, protein: 0, carbs: 0, fat: 0 };
  for (const { kcal, kcalRange, macros, quantity } of portions) {
    total.kcal += kcal * quantity;
    total.low += (kcalRange?.low ?? kcal) * quantity;
    total.high += (kcalRange?.high ?? kcal) * quantity;
    total.protein += macros.protein * quantity;
    total.carbs += macros.carbs * quantity;
    total.fat += macros.fat * quantity;
  }

  const macros = { protein: total.protein, carbs: total.carbs, fat: total.fat };
  const estimated = portions.some((portion) => portion.kcalSource === 'ai');
  return estimated
    ? {
        kcal: total.kcal,
        kcalSource: 'ai',
        kcalRange: { low: total.low, high: total.high },
        macros,
      }
    : { kcal: total.kcal, kcalSource: 'restaurant', macros };
}

/** «54 جم», "54 g": protein, carbs and fat. */
export function formatGrams(grams: number, locale: Locale): string {
  return fillTemplate(formats[locale].grams, { grams: formatNumber(Math.round(grams), locale) });
}
