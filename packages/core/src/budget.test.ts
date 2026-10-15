import { describe, expect, it } from 'vitest';
import { budgetUsage } from './budget.ts';

describe('budgetUsage', () => {
  it('matches the chat screen: 150 of 200 leaves 50 and fills 75% of the bar', () => {
    expect(budgetUsage(20000, 15000)).toEqual({ remaining: 5000, ratio: 0.75, overBudget: false });
  });

  it('is full but not over when spending equals the budget', () => {
    expect(budgetUsage(70000, 70000)).toEqual({ remaining: 0, ratio: 1, overBudget: false });
  });

  it('caps the bar at 100% and reports a negative remainder when over budget', () => {
    expect(budgetUsage(20000, 23000)).toEqual({ remaining: -3000, ratio: 1, overBudget: true });
  });

  it('rejects a budget that is not positive', () => {
    expect(() => budgetUsage(0, 0)).toThrow(RangeError);
  });
});
