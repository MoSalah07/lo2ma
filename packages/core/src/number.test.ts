import { describe, expect, it } from 'vitest';
import {
  fillTemplate,
  formatList,
  formatNumber,
  formatPercent,
  parseWholeNumber,
  toLatinDigits,
} from './number.ts';

describe('formatNumber', () => {
  it('uses Latin digits and the same separators in Arabic and English', () => {
    expect(formatNumber(21480.5, 'ar', 2)).toBe('21,480.50');
    expect(formatNumber(21480.5, 'en', 2)).toBe('21,480.50');
  });
});

describe('formatList', () => {
  it('joins with the right conjunction per language', () => {
    expect(formatList(['فراخ', 'سمك'], 'ar')).toBe('فراخ وسمك');
    expect(formatList(['Chicken', 'fish', 'nuts'], 'en')).toBe('Chicken, fish, and nuts');
    expect(formatList([], 'en')).toBe('');
  });
});

describe('fillTemplate', () => {
  it('fills every placeholder it has a value for', () => {
    expect(fillTemplate('{amount} ج', { amount: '150' })).toBe('150 ج');
  });

  it('leaves unknown placeholders visible so a missing value is easy to spot', () => {
    expect(fillTemplate('{amount} of {total}', { amount: '1' })).toBe('1 of {total}');
  });
});

describe('toLatinDigits', () => {
  it('turns Arabic-Indic and Persian digits into Latin ones', () => {
    expect(toLatinDigits('٢٨ سنة')).toBe('28 سنة');
    expect(toLatinDigits('۱۷۸')).toBe('178');
    expect(toLatinDigits('82')).toBe('82');
  });
});

describe('parseWholeNumber', () => {
  it('reads what a number field holds, in any digits', () => {
    expect(parseWholeNumber('٨٢')).toBe(82);
    expect(parseWholeNumber(' 178 ')).toBe(178);
    expect(parseWholeNumber('')).toBeNull();
    expect(parseWholeNumber('kg')).toBeNull();
  });
});

describe('formatPercent', () => {
  it('formats a share as a percent', () => {
    expect(formatPercent(0.35, 'ar')).toBe('35%');
    expect(formatPercent(0.2, 'en')).toBe('20%');
  });
});
