import {
  addMinutes,
  orderSteps,
  PLAN_SEND_LEAD_MINUTES,
  type Order,
  type OrderStatus,
} from '@lo2ma/core';

/** Minutes before arrival at which each step is expected, in order. */
const STEP_OFFSETS: Record<OrderStatus, number> = {
  sent: -PLAN_SEND_LEAD_MINUTES,
  accepted: -PLAN_SEND_LEAD_MINUTES + 1,
  preparing: -35,
  onTheWay: -20,
  delivered: 0,
};

/** The expected time of every step for an order that should arrive at `arrivalTime`. */
export function timelineFor(arrivalTime: string): Order['timeline'] {
  return orderSteps.map((status) => ({
    status,
    at: addMinutes(arrivalTime, STEP_OFFSETS[status]),
  }));
}

/** The step an order has reached by `time` on its day, or null before it is sent. */
export function stepAt(arrivalTime: string, time: string): OrderStatus | null {
  const reached = timelineFor(arrivalTime).filter((step) => step.at <= time);
  return reached.at(-1)?.status ?? null;
}

/** A demo number; the courier's real number arrives with the restaurant integration. */
const DEMO_COURIER_PHONE = '+201000000000';

/** The courier's number is shared once the order is on the way. */
export function courierPhoneAt(status: OrderStatus): string | undefined {
  const assigned = orderSteps.indexOf(status) >= orderSteps.indexOf('onTheWay');
  return assigned ? DEMO_COURIER_PHONE : undefined;
}
