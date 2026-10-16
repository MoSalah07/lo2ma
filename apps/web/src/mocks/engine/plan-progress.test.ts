// @vitest-environment node
import { planDayBill, SHARED_DELIVERY_FEE, type PlanDay, type WeeklyPlan } from '@lo2ma/core';
import { describe, expect, it } from 'vitest';
import { isOver, planOrders, withProgress } from './plan-progress';
import { suggestMeals } from './suggest';

function aMeal() {
  const [meal] = suggestMeals({ budget: Number.MAX_SAFE_INTEGER, exclusions: [] }, 1);
  if (!meal) throw new Error('The seed data should always have a meal');
  return meal;
}

const suggestion = aMeal();
const days: PlanDay[] = [
  { date: '2026-10-19', weekday: 'mon', suggestion, canChange: true },
  { date: '2026-10-20', weekday: 'tue', suggestion, canChange: true },
  { date: '2026-10-21', weekday: 'wed', suggestion, canChange: true },
];

/** A 1:30 break: lunch arrives at 1:15 and each order goes out at 12:30. */
const planOf = (confirmed: boolean): WeeklyPlan => ({
  id: 'plan-test',
  days,
  budget: 45000,
  total: 0,
  sharedDeliveryFee: SHARED_DELIVERY_FEE,
  breakTime: '13:30',
  arrivalTime: '13:15',
  sendTime: '12:30',
  changeCutoff: '11:30',
  confirmed,
});

/** Tuesday 20 October 2026, the middle day, on the user's own clock. */
const at = (time: string) => new Date(`2026-10-20T${time}:00`);
const statuses = (plan: WeeklyPlan) => plan.days.map((day) => day.status);

describe('withProgress', () => {
  it('gives a draft no statuses, and lets only its days to come change', () => {
    const plan = withProgress(planOf(false), at('10:00'));
    expect(statuses(plan)).toEqual([undefined, undefined, undefined]);
    expect(plan.days.map((day) => day.canChange)).toEqual([false, true, true]);
  });

  it('keeps today scheduled until its send time, then follows the order', () => {
    expect(statuses(withProgress(planOf(true), at('12:29')))).toEqual([
      'delivered',
      'scheduled',
      'scheduled',
    ]);
    expect(statuses(withProgress(planOf(true), at('12:30')))).toEqual([
      'delivered',
      'sent',
      'scheduled',
    ]);
    expect(statuses(withProgress(planOf(true), at('12:55')))).toEqual([
      'delivered',
      'onTheWay',
      'scheduled',
    ]);
  });

  it('marks today delivered at the arrival time, and says when', () => {
    const today = withProgress(planOf(true), at('13:15')).days[1];
    expect(today?.status).toBe('delivered');
    expect(today?.deliveredAt).toBe('13:15');
  });

  it('locks today at the cutoff', () => {
    expect(withProgress(planOf(true), at('11:29')).days[1]?.canChange).toBe(true);
    expect(withProgress(planOf(true), at('11:30')).days[1]?.canChange).toBe(false);
  });
});

describe('planOrders', () => {
  it("lists the days sent so far, newest first, at the plan's own price", () => {
    const orders = planOrders(planOf(true), at('12:50'));
    expect(orders.map((order) => order.id)).toEqual(['PL-20261020', 'PL-20261019']);
    expect(orders[0]?.status).toBe('preparing');
    expect(orders[0]?.suggestion.bill).toEqual(planDayBill(suggestion.bill.food));
  });

  it('has nothing before the plan is confirmed', () => {
    expect(planOrders(planOf(false), at('12:50'))).toEqual([]);
  });
});

describe('isOver', () => {
  it('turns true only once the last day has passed', () => {
    expect(isOver(planOf(true), at('23:59'))).toBe(false);
    expect(isOver(planOf(true), new Date('2026-10-22T08:00:00'))).toBe(true);
  });
});
