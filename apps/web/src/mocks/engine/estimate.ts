import type { KcalRange, Macros } from '@lo2ma/core';
import { foods, type FoodId, type Recipe } from '../data/foods';

/** One row of «حسبناها ازاي»: a food, its grams, and what it adds. */
export interface RecipeLine {
  food: FoodId;
  grams: number;
  kcal: number;
  protein: number;
}

export interface DishEstimate {
  kcalRange: KcalRange;
  macros: Macros;
  lines: RecipeLine[];
}

const per100 = (grams: number, value: number) => (grams * value) / 100;
const roundTo = (value: number, step: number) => Math.round(value / step) * step;

/**
 * The mock of the backend's estimate (C-lite): the recipe's grams are scaled until they add up to the dish's
 * calories, then plain arithmetic gives the macros, and the range comes from how much each food's portion varies.
 */
export function estimateDish(recipe: Recipe, kcal: number): DishEstimate {
  const entries = Object.entries(recipe) as [FoodId, number][];
  const raw = entries.reduce((sum, [id, grams]) => sum + per100(grams, foods[id].kcal), 0);
  const scale = kcal / raw;

  const total = { low: 0, high: 0, protein: 0, carbs: 0, fat: 0 };
  const lines = entries.map(([id, recipeGrams]) => {
    const facts = foods[id];
    const grams = recipeGrams * scale;
    const lineKcal = per100(grams, facts.kcal);
    total.low += lineKcal * (1 - facts.spread);
    total.high += lineKcal * (1 + facts.spread);
    total.protein += per100(grams, facts.protein);
    total.carbs += per100(grams, facts.carbs);
    total.fat += per100(grams, facts.fat);
    return {
      food: id,
      // Whole grams for a spoon of oil, steps of 5 for the rest: it is an estimate, not a scale.
      grams: grams < 20 ? Math.max(1, Math.round(grams)) : roundTo(grams, 5),
      kcal: roundTo(lineKcal, 5),
      protein: Math.round(per100(grams, facts.protein)),
    };
  });

  return {
    kcalRange: { low: Math.floor(total.low / 10) * 10, high: Math.ceil(total.high / 10) * 10 },
    macros: {
      protein: Math.round(total.protein),
      carbs: Math.round(total.carbs),
      fat: Math.round(total.fat),
    },
    lines,
  };
}
