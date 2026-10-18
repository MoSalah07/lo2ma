import { describe, expect, it } from 'vitest';
import {
  orderProgress,
  orderStepAt,
  orderTimeline,
  planDayProgress,
  planDayStatusAt,
  sharesCourierPhone,
} from './orders.ts';

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

describe('orderTimeline', () => {
  it('sends a 1:15 lunch at 12:30 and has it leave the kitchen at 12:55', () => {
    expect(orderTimeline('13:15')).toEqual([
      { status: 'sent', at: '12:30' },
      { status: 'accepted', at: '12:31' },
      { status: 'preparing', at: '12:40' },
      { status: 'onTheWay', at: '12:55' },
      { status: 'delivered', at: '13:15' },
    ]);
  });
});

describe('orderStepAt', () => {
  it('has no step before the order goes out, then the last one reached', () => {
    expect(orderStepAt('13:15', '12:29')).toBeNull();
    expect(orderStepAt('13:15', '12:30')).toBe('sent');
    expect(orderStepAt('13:15', '12:54')).toBe('preparing');
    expect(orderStepAt('13:15', '13:15')).toBe('delivered');
    expect(orderStepAt('13:15', '18:00')).toBe('delivered');
  });
});

describe('sharesCourierPhone', () => {
  it('shares the number only once the order is on the way', () => {
    expect(sharesCourierPhone('preparing')).toBe(false);
    expect(sharesCourierPhone('onTheWay')).toBe(true);
    expect(sharesCourierPhone('delivered')).toBe(true);
  });
});

describe('planDayStatusAt', () => {
  it('delivers the days before, schedules the days after, and follows today by the clock', () => {
    const today = '2026-10-20';
    expect(planDayStatusAt('2026-10-19', today, '09:00', '13:15')).toBe('delivered');
    expect(planDayStatusAt('2026-10-21', today, '23:00', '13:15')).toBe('scheduled');
    expect(planDayStatusAt(today, today, '12:29', '13:15')).toBe('scheduled');
    expect(planDayStatusAt(today, today, '12:55', '13:15')).toBe('onTheWay');
  });
});
