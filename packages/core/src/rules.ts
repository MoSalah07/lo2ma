import { fromPounds, type Piasters } from './money.ts';

/** The smallest order Lo2ma accepts: 100 EGP on the food alone, before delivery and service. */
export const MIN_ORDER: Piasters = fromPounds(100);

/** Lo2ma's service fee on every order. */
export const SERVICE_FEE: Piasters = fromPounds(10);

/** Delivery per day when a weekly plan is batched with coworkers. */
export const SHARED_DELIVERY_FEE: Piasters = fromPounds(10);

/** Lunch arrives this many minutes before the break starts. */
export const ARRIVAL_BUFFER_MINUTES = 15;

/** Break times offered in onboarding. */
export const BREAK_TIMES = ['12:30', '13:00', '13:30', '14:00'] as const;

/** How much the budget stepper moves per tap. */
export const BUDGET_STEP: Piasters = fromPounds(25);

/** A planned day can be changed until this time on the same morning. */
export const PLAN_CHANGE_CUTOFF = '11:30';

export function meetsMinimumOrder(foodSubtotal: Piasters): boolean {
  return foodSubtotal >= MIN_ORDER;
}
