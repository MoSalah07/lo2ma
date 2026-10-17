import { describe, expect, it } from 'vitest';
import { averageMeal, compareForFit, mealFit, type MealNumbers } from './meal-fit.ts';

/** The canvas example's goal. */
const goal = { kcal: 780, protein: 57 };

const meal = (kcal: number, protein: number, high?: number): MealNumbers => ({
  kcal,
  ...(high !== undefined && { kcalRange: { low: kcal - 60, high } }),
  macros: { protein, carbs: 40, fat: 30 },
});

describe('mealFit', () => {
  it('puts the canvas steak in the goal: about 740 kcal, up to 810, and 54 g of protein', () => {
    expect(mealFit(goal, meal(740, 54, 810))).toBe('inGoal');
  });

  it('counts an estimate by its highest likely number', () => {
    expect(mealFit(goal, meal(800, 60))).toBe('inGoal');
    expect(mealFit(goal, meal(800, 60, 900))).toBe('over');
  });

  it('says when the calories fit but the protein falls short', () => {
    expect(mealFit(goal, meal(760, 42, 820))).toBe('lowProtein');
  });

  it('marks a meal well under the goal', () => {
    expect(mealFit(goal, meal(540, 50))).toBe('under');
  });
});

describe('compareForFit', () => {
  const steak = meal(740, 54, 810);
  const kofta = meal(760, 42, 820);
  const fish = meal(720, 55, 780);
  const salad = meal(450, 30);
  const feast = meal(1050, 60);

  it('lists meals in the goal first, then the closest, then the most protein', () => {
    const sorted = [feast, salad, kofta, fish, steak].sort(compareForFit(goal));
    expect(sorted).toEqual([fish, steak, kofta, salad, feast]);
  });

  it('puts protein before closeness for «بروتين أعلى»', () => {
    const onTheDot = meal(780, 58, 840);
    const lean = meal(720, 70, 790);
    expect([lean, onTheDot].sort(compareForFit(goal))).toEqual([onTheDot, lean]);
    expect([onTheDot, lean].sort(compareForFit(goal, { proteinFirst: true }))).toEqual([
      lean,
      onTheDot,
    ]);
  });
});

describe('averageMeal', () => {
  it('averages calories and protein over the week, rounded', () => {
    expect(averageMeal([meal(740, 54), meal(720, 55), meal(761, 42)])).toEqual({
      kcal: 740,
      protein: 50,
    });
  });

  it('has no average without meals', () => {
    expect(averageMeal([])).toBeNull();
  });
});
