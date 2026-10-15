import { describe, expect, it } from 'vitest';
import { MIN_ORDER, meetsMinimumOrder } from './rules.ts';

describe('minimum order', () => {
  it('is 100 EGP', () => {
    expect(MIN_ORDER).toBe(10000);
  });

  it('accepts food worth exactly 100 EGP or more', () => {
    expect(meetsMinimumOrder(10000)).toBe(true);
    expect(meetsMinimumOrder(12000)).toBe(true);
  });

  it('refuses food under 100 EGP, even if fees push the total above it', () => {
    expect(meetsMinimumOrder(9999)).toBe(false);
    expect(meetsMinimumOrder(9000)).toBe(false);
  });
});
