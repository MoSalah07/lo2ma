import {
  BREAK_TIMES,
  formatCalories,
  formatGrams,
  formatNumber,
  fromPounds,
  ingredientSchema,
  MIN_ORDER,
  type CaloriePref,
  type FitTarget,
  type UserPrefs,
} from '@lo2ma/core';
import type { Locale } from '@lo2ma/i18n';
import { useLocale, useTranslations } from 'next-intl';

/** The calorie choices onboarding offers. «وضع الفورمة» comes after them and opens its own screen. */
export const calorieOptions: CaloriePref[] = [
  { mode: 'any' },
  { mode: 'around', kcal: 700 },
  { mode: 'under', kcal: 500 },
];

/** The goal behind a calorie preference, or undefined outside «وضع الفورمة». */
export function fitTargetOf(pref: CaloriePref | undefined): FitTarget | undefined {
  return pref?.mode === 'fit' ? { kcal: pref.kcal, protein: pref.protein } : undefined;
}

/** Where «أنا عارف رقمي» starts for someone who never set a fit goal. */
export const defaultFitTarget: FitTarget = { kcal: 700, protein: 40 };

export const ingredients = ingredientSchema.options;

export const budgetLimits = { min: MIN_ORDER, max: fromPounds(500) };

/** Starting values for someone who has never set preferences. */
export function defaultPrefs(workplace: UserPrefs['workplace']): UserPrefs {
  return {
    workplace,
    breakTime: BREAK_TIMES[2],
    budget: fromPounds(150),
    calories: { mode: 'around', kcal: 700 },
    exclusions: [],
  };
}

export const sameCalories = (a: CaloriePref, b: CaloriePref) =>
  a.mode === b.mode && (a.mode === 'any' || (b.mode !== 'any' && a.kcal === b.kcal));

/** «مش فارقة», «حوالي 700», «أقل من 500», «فورمة · 780 سعر · 57 جم». */
export function useCalorieLabel() {
  const t = useTranslations('prefs');
  const locale: Locale = useLocale();
  return (pref: CaloriePref) => {
    if (pref.mode === 'any') return t('caloriesAny');
    if (pref.mode === 'fit') {
      return t('caloriesFit', {
        calories: formatCalories(pref.kcal, locale),
        protein: formatGrams(pref.protein, locale),
      });
    }
    const kcal = formatNumber(pref.kcal, locale);
    return pref.mode === 'around' ? t('caloriesAround', { kcal }) : t('caloriesUnder', { kcal });
  };
}
