import { intlLocales, type Locale } from '@lo2ma/i18n';

/** "2026-10-18" → a Date at local midnight (not UTC, so the day never shifts). */
function parseIsoDate(date: string): Date {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** A week range the way the plan screen shows it: «18 – 22 أكتوبر», «Oct 18 – 22». */
export function formatDateRange(from: string, to: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocales[locale], {
    day: 'numeric',
    month: 'long',
  }).formatRange(parseIsoDate(from), parseIsoDate(to));
}

/** A single day: «31 أكتوبر», "Oct 31". */
export function formatDayMonth(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocales[locale], { day: 'numeric', month: 'short' }).format(
    parseIsoDate(date),
  );
}

/** A month's name from "YYYY-MM": «أكتوبر», "October". */
export function formatMonthName(month: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocales[locale], { month: 'long' }).format(
    parseIsoDate(`${month}-01`),
  );
}

/** Today (or `date`) on the user's own calendar, as "YYYY-MM-DD". */
export function toIsoDate(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type Weekday = (typeof weekdays)[number];

/** The weekday key of a date, for the Egyptian day names in messages: "2026-10-14" → "wed". */
export function weekdayOf(date: string): Weekday {
  return weekdays[parseIsoDate(date).getDay()]!;
}

/** The day of the month, for the day cards: "2026-10-18" → "18". */
export function dayOfMonth(date: string): string {
  return String(parseIsoDate(date).getDate());
}

/** Seconds left on a timer: 42 → "0:42", 125 → "2:05". */
export function formatCountdown(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}
