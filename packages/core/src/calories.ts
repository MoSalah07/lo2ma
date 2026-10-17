import { formats } from '@lo2ma/i18n/formats';
import type { Locale } from '@lo2ma/i18n/locales';
import { fillTemplate, formatNumber } from './number.ts';
import type { KcalRange } from './schemas/food.ts';

interface CalorieOptions {
  /** True for estimates (for example from the AI): «حوالي 900 سعر» instead of «900 سعر». */
  approximate?: boolean;
}

export function formatCalories(
  kcal: number,
  locale: Locale,
  { approximate = false }: CalorieOptions = {},
): string {
  const format = formats[locale];
  const template = approximate ? format.caloriesApprox : format.calories;
  return fillTemplate(template, { kcal: formatNumber(Math.round(kcal), locale) });
}

/** An estimate's range: «بين 680 و810 سعر», "680–810 kcal". */
export function formatCalorieRange(range: KcalRange, locale: Locale): string {
  return fillTemplate(formats[locale].caloriesRange, {
    low: formatNumber(Math.round(range.low), locale),
    high: formatNumber(Math.round(range.high), locale),
  });
}
