import {
  canChangePlanDay,
  orderTimeline,
  planChangeDeadline,
  planDayBill,
  planDayStatusAt,
  timeOf,
  toIsoDate,
  type Order,
  type PlanDay,
  type WeeklyPlan,
} from '@lo2ma/core';
import { courierPhoneAt } from './order-timeline';

// In phase 5 the scheduler sends each planned day's order and the restaurant moves it along.
// The mock reads the same story off the clock instead, so the plan screen shows it as days pass.

const planOrderId = (date: string) => `PL-${date.replaceAll('-', '')}`;

function progressOf(day: PlanDay, plan: WeeklyPlan, now: Date): PlanDay {
  const deadline = planChangeDeadline(plan.sendTime, plan.changeCutoff);
  const base = { ...day, canChange: canChangePlanDay(day.date, now, deadline) };
  if (!plan.confirmed) return base;

  const status = planDayStatusAt(day.date, toIsoDate(now), timeOf(now), plan.arrivalTime);
  if (status === 'scheduled') return { ...base, status };
  const deliveredAt = status === 'delivered' ? plan.arrivalTime : undefined;
  return { ...base, status, orderId: planOrderId(day.date), deliveredAt };
}

/** The plan as the clock has moved it: which days can change and where each confirmed day is. */
export function withProgress(plan: WeeklyPlan, now = new Date()): WeeklyPlan {
  return { ...plan, days: plan.days.map((day) => progressOf(day, plan, now)) };
}

/** Whether every day of the plan is behind us. */
export function isOver(plan: WeeklyPlan, now = new Date()): boolean {
  const last = plan.days.at(-1)?.date;
  return last !== undefined && last < toIsoDate(now);
}

/** The orders a confirmed plan has sent so far, newest first, in the shape the orders API returns. */
export function planOrders(plan: WeeklyPlan | null, now = new Date()): Order[] {
  if (!plan?.confirmed) return [];
  return withProgress(plan, now)
    .days.flatMap((day): Order[] => {
      if (!day.orderId || !day.status || day.status === 'scheduled') return [];
      return [
        {
          id: day.orderId,
          // The plan charges its own bill: the food plus the shared delivery.
          suggestion: { ...day.suggestion, bill: planDayBill(day.suggestion.bill.food) },
          status: day.status,
          timeline: orderTimeline(plan.arrivalTime),
          breakTime: plan.breakTime,
          arrivalTime: plan.arrivalTime,
          onTime: true,
          paymentMethod: 'card',
          courierPhone: courierPhoneAt(day.status),
        },
      ];
    })
    .reverse();
}
