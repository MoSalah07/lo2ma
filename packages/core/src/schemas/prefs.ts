import { z } from 'zod';
import { MIN_ORDER, WORKPLACE_DETAILS_MAX } from '../rules.ts';
import { ingredientSchema, localizedTextSchema, piastersSchema, time24Schema } from './common.ts';
import { geoPointSchema } from './location.ts';

export const caloriePrefSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('any') }),
  z.object({ mode: z.literal('around'), kcal: z.int().positive() }),
  z.object({ mode: z.literal('under'), kcal: z.int().positive() }),
]);
export type CaloriePref = z.infer<typeof caloriePrefSchema>;

/** Where lunch goes: a point on the map, its name in both languages, and what the courier should know. */
export const workplaceSchema = z.object({
  name: localizedTextSchema,
  /** The district and city: «أبو رواش، الجيزة». */
  area: localizedTextSchema,
  point: geoPointSchema,
  /** «مبنى B2، الدور التالت»: written by the user, so it stays in their words. */
  details: z.string().trim().max(WORKPLACE_DETAILS_MAX),
});
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
