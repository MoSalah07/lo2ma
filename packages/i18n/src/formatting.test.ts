import { IntlMessageFormat } from 'intl-messageformat';
import { describe, expect, it } from 'vitest';
import { intlLocales, type Locale } from './locales.ts';
import { messages } from './messages.ts';

const format = (locale: Locale, message: string, values: Record<string, string | number> = {}) =>
  new IntlMessageFormat(message, intlLocales[locale]).format(values);

describe('formatting real messages', () => {
  it('picks the right Arabic plural form, with Latin digits', () => {
    const minutes = [1, 2, 3, 11, 100].map((count) =>
      format('ar', messages.ar.common.minutes, { count }),
    );
    expect(minutes).toEqual(['دقيقة', 'دقيقتين', '3 دقايق', '11 دقيقة', '100 دقيقة']);
  });

  it('says «ربع ساعة» for 15 minutes instead of a number', () => {
    expect(format('ar', messages.ar.common.beforeBreak, { minutes: 15 })).toBe(
      'قبل البريك بربع ساعة',
    );
    expect(format('ar', messages.ar.common.beforeBreak, { minutes: 5 })).toBe(
      'قبل البريك بـ5 دقايق',
    );
    expect(format('en', messages.en.common.beforeBreak, { minutes: 15 })).toBe(
      '15 min before your break',
    );
  });

  it('keeps apostrophes in English (ICU treats some of them as escape characters)', () => {
    expect(format('en', messages.en.chat.greeting)).toBe(
      "Hi! What's your budget today, and what do you feel like?",
    );
  });
});
