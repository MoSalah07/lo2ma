import { z } from 'zod';
import { localizedTextSchema } from './common.ts';
import { calorieSourceSchema, kcalRangeSchema } from './food.ts';

/** One food of an estimated dish, as «حسبناها ازاي» lists it. */
export const recipeLineSchema = z.object({
  name: localizedTextSchema,
  grams: z.int().positive(),
  kcal: z.int().nonnegative(),
  protein: z.int().nonnegative(),
});
export type RecipeLine = z.infer<typeof recipeLineSchema>;

/** A dish of a meal and how its calories were worked out. A published dish has no lines: its number is the restaurant's. */
export const dishBreakdownSchema = z.object({
  id: z.string(),
  name: localizedTextSchema,
  quantity: z.int().positive(),
  kcal: z.int().positive(),
  kcalSource: calorieSourceSchema,
  kcalRange: kcalRangeSchema.optional(),
  lines: z.array(recipeLineSchema),
});
export type DishBreakdown = z.infer<typeof dishBreakdownSchema>;

/** GET /api/suggestions/:id/nutrition */
export const mealBreakdownSchema = z.object({ dishes: z.array(dishBreakdownSchema).min(1) });
export type MealBreakdown = z.infer<typeof mealBreakdownSchema>;
