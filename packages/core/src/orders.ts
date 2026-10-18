import { PLAN_SEND_LEAD_MINUTES } from './rules.ts';
import { orderSteps, type Order, type OrderStatus } from './schemas/order.ts';
import type { PlanDayStatus } from './schemas/plan.ts';
import { addMinutes } from './time.ts';

/**
 * When each step of an order is expected, in minutes before it arrives: it goes to the restaurant
 * PLAN_SEND_LEAD_MINUTES ahead, is accepted a minute later, cooks, and leaves the kitchen 20 minutes out.
 */
export const ORDER_STEP_MINUTES: Readonly<Record<OrderStatus, number>> = {
  sent: -PLAN_SEND_LEAD_MINUTES,
  accepted: -PLAN_SEND_LEAD_MINUTES + 1,
  preparing: -35,
  onTheWay: -20,
  delivered: 0,
};

/** How far along an order is, from 0 (sent to the restaurant) to 1 (delivered), for progress bars. */
export function orderProgress(status: OrderStatus): number {
  return orderSteps.indexOf(status) / (orderSteps.length - 1);
}

/** How far a planned day is: nothing until its order is sent, then the order's own progress. */
export function planDayProgress(status: PlanDayStatus | undefined): number {
  return !status || status === 'scheduled' ? 0 : orderProgress(status);
}

/** The expected time of every step, for an order that should arrive at `arrivalTime` ("HH:mm"). */
export function orderTimeline(arrivalTime: string): Order['timeline'] {
  return orderSteps.map((status) => ({
    status,
    at: addMinutes(arrivalTime, ORDER_STEP_MINUTES[status]),
  }));
}

/** The step an order has reached by `time` ("HH:mm") on its day, or null before it is sent. */
export function orderStepAt(arrivalTime: string, time: string): OrderStatus | null {
  const reached = orderTimeline(arrivalTime).filter((step) => step.at <= time);
  return reached.at(-1)?.status ?? null;
}

/** The courier's number is shared once the order is on the way, never before. */
export function sharesCourierPhone(status: OrderStatus): boolean {
  return orderSteps.indexOf(status) >= orderSteps.indexOf('onTheWay');
}

/**
 * Where a confirmed plan's day stands when it is `today` at `time` (dates "YYYY-MM-DD", times "HH:mm", both on
 * Cairo's calendar and clock): the days before are delivered, the days after are scheduled, and today follows its
 * order from the moment it goes out.
 */
export function planDayStatusAt(
  date: string,
  today: string,
  time: string,
  arrivalTime: string,
): PlanDayStatus {
  if (date > today) return 'scheduled';
  if (date < today) return 'delivered';
  return orderStepAt(arrivalTime, time) ?? 'scheduled';
}
