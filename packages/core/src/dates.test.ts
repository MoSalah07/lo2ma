import { describe, expect, it } from 'vitest';
import {
  dayOfMonth,
  formatCountdown,
  formatDateRange,
  formatDayMonth,
  formatMonthName,
  toIsoDate,
  weekdayOf,
} from './dates.ts';

describe('formatDateRange', () => {
  it('shows a week like the plan screen, with Latin digits', () => {
    const ar = formatDateRange('2026-10-18', '2026-10-22', 'ar');
    expect(ar).toContain('18');
    expect(ar).toContain('22');
    expect(ar).toContain('أكتوبر');
    expect(ar).not.toMatch(/[٠-٩]/);
    expect(formatDateRange('2026-10-18', '2026-10-22', 'en')).toMatch(/October 18\s*–\s*22/);
  });
});

describe('dayOfMonth', () => {
  it('reads the day without time-zone shifts', () => {
    expect(dayOfMonth('2026-10-18')).toBe('18');
    expect(dayOfMonth('2026-11-01')).toBe('1');
  });
});

describe('formatCountdown', () => {
  it.each([
    [42, '0:42'],
    [125, '2:05'],
    [0, '0:00'],
    [-3, '0:00'],
  ])('shows %i seconds as %s', (seconds, expected) => {
    expect(formatCountdown(seconds)).toBe(expected);
  });
});

describe('formatDayMonth and formatMonthName', () => {
  it('names the day and the month the way each language does', () => {
    expect(formatDayMonth('2026-10-31', 'ar')).toBe('31 أكتوبر');
    expect(formatDayMonth('2026-10-31', 'en')).toBe('Oct 31');
    expect(formatMonthName('2026-10', 'ar')).toBe('أكتوبر');
    expect(formatMonthName('2026-10', 'en')).toBe('October');
  });
});

describe('weekdayOf', () => {
  it('names the weekday of a date without time-zone shifts', () => {
    expect(weekdayOf('2026-10-14')).toBe('wed');
    expect(weekdayOf('2026-10-18')).toBe('sun');
  });
});

describe('toIsoDate', () => {
  it('uses the local calendar day, not UTC', () => {
    expect(toIsoDate(new Date(2026, 9, 15, 23, 30))).toBe('2026-10-15');
    expect(toIsoDate(new Date(2026, 0, 5, 0, 10))).toBe('2026-01-05');
  });
});
