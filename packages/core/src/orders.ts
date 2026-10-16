import { orderSteps, type OrderStatus } from './schemas/order.ts';
import type { PlanDayStatus } from './schemas/plan.ts';

/** How far along an order is, from 0 (sent to the restaurant) to 1 (delivered), for progress bars. */
export function orderProgress(status: OrderStatus): number {
  return orderSteps.indexOf(status) / (orderSteps.length - 1);
}

/** How far a planned day is: nothing until its order is sent, then the order's own progress. */
export function planDayProgress(status: PlanDayStatus | undefined): number {
  return !status || status === 'scheduled' ? 0 : orderProgress(status);
}
