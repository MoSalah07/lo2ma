import { describe, expect, it } from 'vitest';
import { formatGrams, mealNutrition, type Portion } from './nutrition.ts';

const published: Portion = {
  kcal: 450,
  kcalSource: 'restaurant',
  macros: { protein: 30, carbs: 40, fat: 15 },
  quantity: 1,
};

const estimated: Portion = {
  kcal: 300,
  kcalSource: 'ai',
  kcalRange: { low: 250, high: 360 },
  macros: { protein: 10, carbs: 35, fat: 12 },
  quantity: 1,
};

describe('mealNutrition', () => {
  it('adds up a meal the restaurant published, with no range', () => {
    expect(mealNutrition([published, { ...published, quantity: 2 }])).toEqual({
      kcal: 1350,
      kcalSource: 'restaurant',
      macros: { protein: 90, carbs: 120, fat: 45 },
    });
  });

  it('makes the meal an estimate when one dish is, counting published dishes as exact', () => {
    expect(mealNutrition([published, estimated])).toEqual({
      kcal: 750,
      kcalSource: 'ai',
      kcalRange: { low: 700, high: 810 },
      macros: { protein: 40, carbs: 75, fat: 27 },
    });
  });

  it('multiplies by the quantity, range included', () => {
    expect(mealNutrition([{ ...estimated, quantity: 3 }])).toMatchObject({
      kcal: 900,
      kcalRange: { low: 750, high: 1080 },
      macros: { protein: 30 },
    });
  });

  it('treats an estimate without a range as exact on both ends', () => {
    const { kcalRange: _, ...withoutRange } = estimated;
    expect(mealNutrition([withoutRange]).kcalRange).toEqual({ low: 300, high: 300 });
  });
});

describe('formatGrams', () => {
  it('formats grams in both languages, rounded', () => {
    expect(formatGrams(54, 'ar')).toBe('54 جم');
    expect(formatGrams(53.6, 'en')).toBe('54 g');
  });

  it('keeps decimals when asked, for protein per kilogram', () => {
    expect(formatGrams(1.6, 'ar', 1)).toBe('1.6 جم');
  });
});
