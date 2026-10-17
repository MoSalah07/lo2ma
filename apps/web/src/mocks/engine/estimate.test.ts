import { describe, expect, it } from 'vitest';
import { dishesByCuisine } from '../data/dishes';
import { foods } from '../data/foods';
import { menu } from '../data/restaurants';
import { estimateDish } from './estimate';

/** Calories from the macros: 4 per gram of protein and carbs, 9 per gram of fat. */
const energy = ({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) =>
  protein * 4 + carbs * 4 + fat * 9;

const templates = Object.values(dishesByCuisine).flat();

describe('foods', () => {
  it('have calories that agree with their macros', () => {
    for (const [id, facts] of Object.entries(foods)) {
      expect(Math.abs(energy(facts) - facts.kcal) / facts.kcal, id).toBeLessThan(0.15);
    }
  });
});

describe('estimateDish', () => {
  it('scales the recipe to the calories, then works out the macros and the range', () => {
    expect(estimateDish({ rice: 100 }, 260)).toEqual({
      kcalRange: { low: 200, high: 320 },
      macros: { protein: 5, carbs: 56, fat: 1 },
      lines: [{ food: 'rice', grams: 200, kcal: 260, protein: 5 }],
    });
  });

  it('keeps every dish within its range, with macros that add up to its calories', () => {
    for (const { name, recipe, kcal } of templates) {
      const { kcalRange, macros, lines } = estimateDish(recipe, kcal);
      expect(kcalRange.low, name.en).toBeLessThan(kcal);
      expect(kcalRange.high, name.en).toBeGreaterThan(kcal);
      expect(Math.abs(energy(macros) - kcal) / kcal, name.en).toBeLessThan(0.15);
      const linesKcal = lines.reduce((sum, line) => sum + line.kcal, 0);
      expect(Math.abs(linesKcal - kcal), name.en).toBeLessThanOrEqual(5 * lines.length);
    }
  });
});

describe('menu nutrition', () => {
  it('gives estimates a range and published numbers none', () => {
    for (const dish of menu) {
      expect(dish.kcalRange !== undefined, dish.id).toBe(dish.kcalSource === 'ai');
    }
    expect(menu.some((dish) => dish.kcalSource === 'restaurant')).toBe(true);
  });
});
