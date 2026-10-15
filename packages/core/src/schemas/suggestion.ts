import { z } from 'zod';
import { piastersSchema } from './common.ts';
import { calorieSourceSchema, menuItemSchema, restaurantSchema } from './food.ts';

export const billSchema = z.object({
  food: piastersSchema,
  delivery: piastersSchema,
  service: piastersSchema,
  total: piastersSchema,
});

/** One meal the agent proposes: a restaurant, the dishes, the bill and the calories. */
export const suggestionSchema = z.object({
  id: z.string(),
  restaurant: restaurantSchema,
  items: z.array(menuItemSchema.extend({ quantity: z.int().positive() })).min(1),
  bill: billSchema,
  kcal: z.int().positive(),
  /** "ai" when any dish's calories are an estimate. */
  kcalSource: calorieSourceSchema,
  bestValue: z.boolean(),
});
export type Suggestion = z.infer<typeof suggestionSchema>;
