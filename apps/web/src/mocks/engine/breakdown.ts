import type { MealBreakdown } from '@lo2ma/core';
import { foods } from '../data/foods';
import { estimateDish } from './estimate';
import { dishesFromId } from './suggest';

/** «حسبناها ازاي» for a suggestion: each dish, and the foods of the ones we estimated. */
export function mealBreakdown(id: string): MealBreakdown | null {
  const dishes = dishesFromId(id);
  if (!dishes) return null;

  return {
    dishes: dishes.map(({ id: dishId, name, kcal, kcalSource, kcalRange, recipe }) => ({
      id: dishId,
      name,
      quantity: 1,
      kcal,
      kcalSource,
      ...(kcalRange && { kcalRange }),
      lines:
        kcalSource === 'ai'
          ? estimateDish(recipe, kcal).lines.map(({ food, ...line }) => ({
              name: foods[food].name,
              ...line,
            }))
          : [],
    })),
  };
}
