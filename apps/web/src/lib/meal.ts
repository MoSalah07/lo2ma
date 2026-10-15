import type { Ingredient, Suggestion } from '@lo2ma/core';
import { isVegetarian } from '@lo2ma/core';
import type { Locale } from '@lo2ma/i18n';

/** A meal's name is its dishes joined: «كشري كبير + رز بلبن». */
export function mealName(suggestion: Suggestion, locale: Locale): string {
  return suggestion.items.map((item) => item.name[locale]).join(' + ');
}

/** True when no dish in the meal has meat or fish. */
export function isVegetarianMeal(suggestion: Suggestion): boolean {
  return suggestion.items.every(isVegetarian);
}

/** Which of the user's avoided foods this meal is free of, for the «من غير فراخ» tags. */
export function avoidedIn(suggestion: Suggestion, exclusions: readonly Ingredient[]): Ingredient[] {
  return exclusions.filter((ingredient) =>
    suggestion.items.every((item) => !item.contains.includes(ingredient)),
  );
}

/** Whole pounds without the currency, for the compact breakdown line «أكل 120 · توصيل 20». */
export const pounds = (piasters: number) => piasters / 100;
