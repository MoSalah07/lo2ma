import { z } from 'zod';
import { TIME_24H } from '../time.ts';

/** Text the API sends in both languages, such as dish and restaurant names. */
export const localizedTextSchema = z.object({ ar: z.string().min(1), en: z.string().min(1) });
export type LocalizedText = z.infer<typeof localizedTextSchema>;

/** Money is always a whole, non-negative number of piasters. */
export const piastersSchema = z.int().nonnegative();

/** A 24-hour "HH:mm" time. */
export const time24Schema = z.string().regex(TIME_24H);

/** Ingredients people may avoid. A dish lists every one it contains. */
export const ingredientSchema = z.enum(['chicken', 'beef', 'fish', 'nuts', 'dairy']);
export type Ingredient = z.infer<typeof ingredientSchema>;
