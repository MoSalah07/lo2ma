import { messages, type Locale } from '@lo2ma/i18n';
import { fillTemplate, formatNumber } from './number.ts';

/** Money is always an integer number of piasters (1 EGP = 100 piasters), so sums never drift. */
export type Piasters = number;

export function assertPiasters(value: Piasters): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Money must be a whole number of piasters, got ${value}`);
  }
}

/** Converts pounds (as typed or shown) to piasters, rounding to the nearest piaster. */
export function fromPounds(pounds: number): Piasters {
  return Math.round(pounds * 100);
}

/** «150 ج» in Arabic, «EGP 150» in English. Decimals appear only when there are piasters: «150.50 ج». */
export function formatMoney(amount: Piasters, locale: Locale): string {
  assertPiasters(amount);
  const fractionDigits = amount % 100 === 0 ? 0 : 2;
  return fillTemplate(messages[locale].format.money, {
    amount: formatNumber(amount / 100, locale, fractionDigits),
  });
}
