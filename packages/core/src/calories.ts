import { formats } from '@lo2ma/i18n/formats';
import type { Locale } from '@lo2ma/i18n/locales';
import { fillTemplate, formatNumber } from './number.ts';

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
