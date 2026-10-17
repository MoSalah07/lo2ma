import type { FitTarget } from './schemas/fit.ts';
import type { KcalRange, Macros } from './schemas/food.ts';

/** How far a meal's calories may sit from the goal, either way. */
export const FIT_TOLERANCE = 0.1;

/** A meal is «في هدفك» with at least this share of the protein goal. */
export const FIT_PROTEIN_SHARE = 0.9;

/** Calorie gaps are compared in steps of this size, so a few calories never outweigh more protein. */
const KCAL_STEP = 50;

/** «في هدفك», «بروتين أقل», or outside the calories either way. */
export type MealFit = 'inGoal' | 'lowProtein' | 'over' | 'under';

/** What a meal needs for matching: a suggestion, a plan day's meal. */
export interface MealNumbers {
  kcal: number;
  kcalRange?: KcalRange;
  macros: Macros;
}

export function mealFit(target: FitTarget, meal: MealNumbers): MealFit {
  // An estimate counts its highest likely number, so it never pushes anyone over their goal.
  if ((meal.kcalRange?.high ?? meal.kcal) > target.kcal * (1 + FIT_TOLERANCE)) return 'over';
  if (meal.kcal < target.kcal * (1 - FIT_TOLERANCE)) return 'under';
  return meal.macros.protein >= target.protein * FIT_PROTEIN_SHARE ? 'inGoal' : 'lowProtein';
}

const fitOrder: Record<MealFit, number> = { inGoal: 0, lowProtein: 1, under: 2, over: 3 };

/**
 * Orders meals for a goal: the ones in it first, then the closest calories, then the most protein («بروتين
 * أعلى» puts protein before closeness). Ties keep the order they came in, so a caller sorts by price first.
 */
export function compareForFit(target: FitTarget, { proteinFirst = false } = {}) {
  const gap = (meal: MealNumbers) => Math.round(Math.abs(meal.kcal - target.kcal) / KCAL_STEP);
  return (a: MealNumbers, b: MealNumbers) => {
    const byFit = fitOrder[mealFit(target, a)] - fitOrder[mealFit(target, b)];
    const byGap = gap(a) - gap(b);
    const byProtein = b.macros.protein - a.macros.protein;
    return byFit || (proteinFirst ? byProtein || byGap : byGap || byProtein);
  };
}

/** The meals' calories and protein on average: a week's plan against a fit goal. Null for no meals. */
export function averageMeal(
  meals: readonly MealNumbers[],
): { kcal: number; protein: number } | null {
  if (meals.length === 0) return null;
  const total = meals.reduce(
    (sum, meal) => ({ kcal: sum.kcal + meal.kcal, protein: sum.protein + meal.macros.protein }),
    { kcal: 0, protein: 0 },
  );
  return {
    kcal: Math.round(total.kcal / meals.length),
    protein: Math.round(total.protein / meals.length),
  };
}
