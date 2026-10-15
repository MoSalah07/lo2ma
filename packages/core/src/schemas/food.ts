import { z } from 'zod';
import { ingredientSchema, localizedTextSchema, piastersSchema } from './common.ts';

export const restaurantSchema = z.object({
  id: z.string(),
  name: localizedTextSchema,
  distanceKm: z.number().nonnegative(),
  /** Preparation plus delivery, in minutes. */
  etaMinutes: z.int().positive(),
  deliveryFee: piastersSchema,
});
export type Restaurant = z.infer<typeof restaurantSchema>;

/** Where a calorie number comes from. Every number shown to the user carries its source. */
export const calorieSourceSchema = z.enum(['restaurant', 'ai']);
export type CalorieSource = z.infer<typeof calorieSourceSchema>;

export const menuItemSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  name: localizedTextSchema,
  price: piastersSchema,
  kcal: z.int().positive(),
  kcalSource: calorieSourceSchema,
  contains: z.array(ingredientSchema),
});
export type MenuItem = z.infer<typeof menuItemSchema>;

const MEAT_OR_FISH = new Set(['chicken', 'beef', 'fish']);

/** A dish is vegetarian when it has no meat or fish (dairy and nuts are fine). */
export function isVegetarian(item: Pick<MenuItem, 'contains'>): boolean {
  return item.contains.every((ingredient) => !MEAT_OR_FISH.has(ingredient));
}
