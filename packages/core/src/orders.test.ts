import { describe, expect, it } from 'vitest';
import { orderProgress, planDayProgress } from './orders.ts';

describe('orderProgress', () => {
  it('runs from 0 when the order is sent to 1 when it arrives', () => {
    expect(orderProgress('sent')).toBe(0);
    expect(orderProgress('preparing')).toBe(0.5);
    expect(orderProgress('delivered')).toBe(1);
  });
});

describe('planDayProgress', () => {
  it('stays empty until the day is sent, then follows its order', () => {
    expect(planDayProgress(undefined)).toBe(0);
    expect(planDayProgress('scheduled')).toBe(0);
    expect(planDayProgress('onTheWay')).toBe(0.75);
    expect(planDayProgress('delivered')).toBe(1);
  });
});
