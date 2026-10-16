import ar from '../messages/ar.json' with { type: 'json' };
import en from '../messages/en.json' with { type: 'json' };
import { formats, type Formats } from './formats.ts';
import type { Locale } from './locales.ts';

export type Messages = typeof ar & { format: Formats };

/**
 * Arabic is the source of truth: English must have the same keys (checked by the type and by a test).
 * The `format` group comes from its own files (see formats.ts).
 */
export const messages: Record<Locale, Messages> = {
  ar: { ...ar, format: formats.ar },
  en: { ...en, format: formats.en },
};
