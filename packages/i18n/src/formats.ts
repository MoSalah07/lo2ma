import ar from '../messages/format.ar.json' with { type: 'json' };
import en from '../messages/format.en.json' with { type: 'json' };
import type { Locale } from './locales.ts';

export type Formats = typeof ar;

/**
 * The unit words and number patterns («{amount} ج», «{kcal} سعر»). They live in their own files, so the
 * formatting in @lo2ma/core reaches the browser without the rest of the text. They are also the `format`
 * group of the messages.
 */
export const formats: Record<Locale, Formats> = { ar, en };
