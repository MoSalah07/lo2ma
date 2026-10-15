import { z } from 'zod';
import { MIN_ORDER } from '../rules.ts';
import { ingredientSchema, localizedTextSchema, piastersSchema, time24Schema } from './common.ts';

export const caloriePrefSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('any') }),
  z.object({ mode: z.literal('around'), kcal: z.int().positive() }),
  z.object({ mode: z.literal('under'), kcal: z.int().positive() }),
]);
export type CaloriePref = z.infer<typeof caloriePrefSchema>;

export const workplaceSchema = z.object({ id: z.string(), name: localizedTextSchema });
export type Workplace = z.infer<typeof workplaceSchema>;

/** What onboarding collects and «حسابي» edits. */
export const userPrefsSchema = z.object({
  workplace: workplaceSchema,
  breakTime: time24Schema,
  budget: piastersSchema.min(MIN_ORDER),
  calories: caloriePrefSchema,
  exclusions: z.array(ingredientSchema),
});
export type UserPrefs = z.infer<typeof userPrefsSchema>;
