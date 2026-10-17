import { formats } from '@lo2ma/i18n/formats';
import { intlLocales, type Locale } from '@lo2ma/i18n/locales';

const EASTERN_DIGITS = /[٠-٩۰-۹]/g;

/** «٢٨» → "28": Arabic keyboards type Arabic-Indic (and some Persian) digits. */
export function toLatinDigits(text: string): string {
  return text.replace(EASTERN_DIGITS, (digit) =>
    // Both blocks start at a multiple of 16 (U+0660 and U+06F0), so the remainder is the digit.
    String(digit.charCodeAt(0) % 16),
  );
}

/** What a user typed in a number field as a whole number, or null when there is none. */
export function parseWholeNumber(text: string): number | null {
  const digits = toLatinDigits(text).replace(/\D/g, '');
  return digits ? Number(digits) : null;
}

/** 0.35 → «35%». */
export function formatPercent(share: number, locale: Locale): string {
  return fillTemplate(formats[locale].percent, { value: formatNumber(share * 100, locale) });
}

/** Groups thousands (21,480) and shows exactly `fractionDigits` decimals, with Latin digits in both languages. */
export function formatNumber(value: number, locale: Locale, fractionDigits = 0): string {
  return new Intl.NumberFormat(intlLocales[locale], {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Joins words the way each language does: «فراخ وسمك ومكسرات», "Chicken, fish, and nuts". */
export function formatList(items: readonly string[], locale: Locale): string {
  return new Intl.ListFormat(intlLocales[locale], { type: 'conjunction' }).format(items);
}

/** Fills `{name}` placeholders in a message from packages/i18n. */
export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, key: string) => values[key] ?? placeholder);
}
