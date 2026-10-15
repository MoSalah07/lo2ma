import ar from '../messages/ar.json' with { type: 'json' };
import en from '../messages/en.json' with { type: 'json' };
import type { Locale } from './locales.ts';

export type Messages = typeof ar;

/** Arabic is the source of truth: English must have the same keys (checked by the type and by a test). */
export const messages: Record<Locale, Messages> = { ar, en };
