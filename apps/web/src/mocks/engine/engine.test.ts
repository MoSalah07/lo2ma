import { compareForFit, mealFit, MIN_ORDER } from '@lo2ma/core';
import { describe, expect, it } from 'vitest';
import { menu, restaurants } from '../data/restaurants';
import { parseMessage } from './parse-message';
import { suggestionFromId, suggestMeals } from './suggest';

describe('seed data', () => {
  it('has 30 restaurants, each with a menu', () => {
    expect(restaurants).toHaveLength(30);
    for (const restaurant of restaurants) {
      expect(menu.some((dish) => dish.restaurantId === restaurant.id)).toBe(true);
    }
  });

  it('prices every dish in whole piasters', () => {
    expect(menu.every((dish) => Number.isInteger(dish.price) && dish.price > 0)).toBe(true);
  });
});

describe('parseMessage', () => {
  it('reads the chat example: a budget and a food to avoid', () => {
    expect(parseMessage('معايا 200 جنيه، ومش عايز فراخ')).toMatchObject({
      budget: 20000,
      exclusions: ['chicken'],
    });
  });

  it('reads English, Arabic-Indic digits and calories', () => {
    expect(parseMessage('I have EGP 150, no beef, under 600 kcal')).toMatchObject({
      budget: 15000,
      caloriesMax: 600,
      exclusions: ['beef'],
    });
    expect(parseMessage('معايا ١٨٠')).toMatchObject({ budget: 18000 });
  });

  it('does not treat a wanted food as one to avoid', () => {
    expect(parseMessage('عايز فراخ بـ 200').exclusions).toEqual([]);
  });

  it('spots requests for something lighter, cheaper or a weekly plan', () => {
    expect(parseMessage('حاجة أخف').wantsLighter).toBe(true);
    expect(parseMessage('أرخص من كده').wantsCheaper).toBe(true);
    expect(parseMessage('اعملي خطة الأسبوع').wantsPlan).toBe(true);
  });

  it('reads the fit mode chips in both languages', () => {
    expect(parseMessage('بروتين أعلى').wantsProtein).toBe(true);
    expect(parseMessage('More protein').wantsProtein).toBe(true);
    expect(parseMessage('سعرات أقل').wantsLighter).toBe(true);
    expect(parseMessage('Fewer calories').wantsLighter).toBe(true);
    expect(parseMessage('أقل من 600 سعر')).toMatchObject({ wantsLighter: false, caloriesMax: 600 });
  });
});

describe('suggestMeals with a fit goal', () => {
  const goal = { kcal: 780, protein: 57 };
  const meals = suggestMeals({ budget: 25000, exclusions: ['chicken'], fit: goal });

  it('never offers a meal over the goal, counting estimates by their highest number', () => {
    expect(meals).toHaveLength(3);
    for (const meal of meals) expect(mealFit(goal, meal)).not.toBe('over');
  });

  it('lists the meals closest to the goal first, and marks the cheapest as best value', () => {
    expect([...meals].sort(compareForFit(goal))).toEqual(meals);
    const cheapest = Math.min(...meals.map((meal) => meal.bill.total));
    expect(meals.filter((meal) => meal.bestValue).map((meal) => meal.bill.total)).toEqual([
      cheapest,
    ]);
  });

  it('puts the most protein first when asked', () => {
    const protein = suggestMeals({
      budget: 25000,
      exclusions: ['chicken'],
      fit: goal,
      proteinFirst: true,
    });
    expect([...protein].sort(compareForFit(goal, { proteinFirst: true }))).toEqual(protein);
  });
});

describe('suggestMeals', () => {
  const meals = suggestMeals({ budget: 20000, exclusions: ['chicken'] });

  it('returns three meals within budget, cheapest first, the first marked best value', () => {
    expect(meals).toHaveLength(3);
    expect(meals.every((meal) => meal.bill.total <= 20000)).toBe(true);
    const totals = meals.map((meal) => meal.bill.total);
    expect([...totals].sort((a, b) => a - b)).toEqual(totals);
    expect(meals.map((meal) => meal.bestValue)).toEqual([true, false, false]);
  });

  it('respects the minimum order and the foods to avoid', () => {
    for (const meal of meals) {
      expect(meal.bill.food).toBeGreaterThanOrEqual(MIN_ORDER);
      expect(meal.items.every((item) => !item.contains.includes('chicken'))).toBe(true);
    }
  });

  it('respects a calorie cap and a "cheaper than" limit', () => {
    const light = suggestMeals({ budget: 20000, exclusions: [], caloriesMax: 600 });
    expect(light.every((meal) => meal.kcal <= 600)).toBe(true);
    const cheaper = suggestMeals({ budget: 20000, exclusions: [], below: 14000 });
    expect(cheaper.every((meal) => meal.bill.total < 14000)).toBe(true);
  });

  it('finds nothing when the budget cannot cover the minimum order plus fees', () => {
    expect(suggestMeals({ budget: 11000, exclusions: [] })).toEqual([]);
  });

  it('rebuilds a suggestion from its id', () => {
    const first = meals[0];
    expect(first && suggestionFromId(first.id)?.bill).toEqual(first?.bill);
    expect(suggestionFromId('r99.m1')).toBeNull();
  });
});
