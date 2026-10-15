import { locales } from '@lo2ma/i18n';
import { z } from 'zod';
import { piastersSchema } from './common.ts';
import { suggestionSchema } from './suggestion.ts';

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(500),
  locale: z.enum(locales),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

/**
 * One server-sent event of a chat reply. The text arrives as many `token` events, then the suggestions,
 * then `done`. An `error` ends the stream early.
 */
export const chatEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('token'), text: z.string() }),
  z.object({
    type: z.literal('suggestions'),
    suggestions: z.array(suggestionSchema),
    /** The budget the agent worked with, so the card can show how much is left. */
    budget: piastersSchema.optional(),
  }),
  z.object({ type: z.literal('done') }),
  z.object({ type: z.literal('error'), code: z.string() }),
]);
export type ChatEvent = z.infer<typeof chatEventSchema>;
