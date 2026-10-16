import { describe, expect, it } from 'vitest';
import { CURRENCY_CODE, formatMoney, fromPounds } from './money.ts';

describe('formatMoney', () => {
  it.each([
    [15000, '150 ج', 'EGP 150'],
    [15050, '150.50 ج', 'EGP 150.50'],
    [2148000, '21,480 ج', 'EGP 21,480'],
    [42, '0.42 ج', 'EGP 0.42'],
    [0, '0 ج', 'EGP 0'],
  ])('formats %i piasters as «%s» and «%s»', (piasters, ar, en) => {
    expect(formatMoney(piasters, 'ar')).toBe(ar);
    expect(formatMoney(piasters, 'en')).toBe(en);
  });

  it('rejects amounts that are not whole piasters', () => {
    expect(() => formatMoney(150.5, 'ar')).toThrow(RangeError);
  });
});

describe('fromPounds', () => {
  it('converts pounds to piasters', () => {
    expect(fromPounds(150)).toBe(15000);
    expect(fromPounds(95.5)).toBe(9550);
  });

  it('avoids floating point drift when amounts are added', () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(fromPounds(0.1) + fromPounds(0.2)).toBe(fromPounds(0.3));
  });
});

describe('CURRENCY_CODE', () => {
  it('is the Egyptian pound, as ISO 4217 names it', () => {
    expect(CURRENCY_CODE).toBe('EGP');
  });
});
