import { describe, expect, it } from 'vitest';
import {
  arrivalTimeFor,
  BREAK_TIMES,
  canChangePlanDay,
  MIN_ORDER,
  meetsMinimumOrder,
  PLAN_CHANGE_CUTOFF,
  planChangeDeadline,
  planDayBill,
  planSendTimeFor,
  weeklyPlanTotal,
} from './rules.ts';

describe('plan times', () => {
  it('brings lunch 15 minutes before the break and sends the order 45 minutes before that', () => {
    expect(arrivalTimeFor('13:30')).toBe('13:15');
    expect(planSendTimeFor('13:15')).toBe('12:30');
  });

  it('closes changes at the morning cutoff, or when the order goes out if that is earlier', () => {
    expect(planChangeDeadline('12:30')).toBe('11:30');
    expect(planChangeDeadline('11:00')).toBe('11:00');
  });

  it('sends every offered break time after the cutoff, so a sent order can never change', () => {
    for (const breakTime of BREAK_TIMES) {
      expect(planSendTimeFor(arrivalTimeFor(breakTime)) >= PLAN_CHANGE_CUTOFF).toBe(true);
    }
  });
});

describe('weekly plan money', () => {
  it('charges each day its food plus 10 EGP shared delivery, with no service fee', () => {
    expect(planDayBill(10500)).toEqual({ food: 10500, delivery: 1000, service: 0, total: 11500 });
  });

  it('adds the days up', () => {
    expect(weeklyPlanTotal([10500, 10000, 13000, 12000, 14500])).toBe(65000);
    expect(weeklyPlanTotal([])).toBe(0);
  });
});

describe('canChangePlanDay', () => {
  // Tuesday 20 October 2026, on the user's own clock.
  const at = (time: string) => new Date(`2026-10-20T${time}:00`);

  it('allows any later day', () => {
    expect(canChangePlanDay('2026-10-21', at('23:59'))).toBe(true);
  });

  it('allows the same day only before the 11:30 cutoff', () => {
    expect(canChangePlanDay('2026-10-20', at('11:29'))).toBe(true);
    expect(canChangePlanDay('2026-10-20', at('11:30'))).toBe(false);
    expect(canChangePlanDay('2026-10-20', at('12:50'))).toBe(false);
  });

  it('never allows a day that has passed', () => {
    expect(canChangePlanDay('2026-10-19', at('08:00'))).toBe(false);
  });
});

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
