import { intlLocales, type Locale } from '@lo2ma/i18n/locales';

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
