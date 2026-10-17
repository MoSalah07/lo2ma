import { describe, expect, it } from 'vitest';
import { formatCalorieRange, formatCalories } from './calories.ts';

describe('formatCalories', () => {
  it('formats a known value as in the plan screen', () => {
    expect(formatCalories(690, 'ar')).toBe('690 سعر');
    expect(formatCalories(690, 'en')).toBe('690 kcal');
  });

  it('marks estimates as approximate, as in the chat and meal screens', () => {
    expect(formatCalories(900, 'ar', { approximate: true })).toBe('حوالي 900 سعر');
    expect(formatCalories(900, 'en', { approximate: true })).toBe('~900 kcal');
  });

  it('rounds and groups large values', () => {
    expect(formatCalories(1249.6, 'en')).toBe('1,250 kcal');
  });
});

describe('formatCalorieRange', () => {
  it("formats an estimate's range as in the meal screen", () => {
    expect(formatCalorieRange({ low: 680, high: 810 }, 'ar')).toBe('بين 680 و810 سعر');
    expect(formatCalorieRange({ low: 680, high: 1050 }, 'en')).toBe('680–1,050 kcal');
  });
});
