import { describe, expect, it } from 'vitest';
import { formatEgyptMobile, maskEgyptMobile, normalizeEgyptMobile } from './phone.ts';

describe('normalizeEgyptMobile', () => {
  it.each([
    '01012345678',
    '010 1234 5678',
    '+20 10 1234 5678',
    '00201012345678',
    '1012345678',
    '٠١٠١٢٣٤٥٦٧٨',
  ])('reads "%s" as 1012345678', (input) => {
    expect(normalizeEgyptMobile(input)).toBe('1012345678');
  });

  it.each(['0101234567', '01312345678', '+1 415 555 0101', 'abc', ''])('rejects "%s"', (input) => {
    expect(normalizeEgyptMobile(input)).toBeNull();
  });
});

describe('formatting', () => {
  it('groups the number like the designs', () => {
    expect(formatEgyptMobile('1012345678')).toBe('10 1234 5678');
  });

  it('masks the middle digits', () => {
    expect(maskEgyptMobile('1012345678')).toBe('+20 10 •••• 5678');
  });
});
