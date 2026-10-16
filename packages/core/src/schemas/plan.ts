import { z } from 'zod';
import { piastersSchema, time24Schema } from './common.ts';
import { orderSteps } from './order.ts';
import { suggestionSchema } from './suggestion.ts';

/** Workdays in Egypt: Sunday to Thursday. */
export const workdaySchema = z.enum(['sun', 'mon', 'tue', 'wed', 'thu']);
export type Workday = z.infer<typeof workdaySchema>;

/** Where a day of a confirmed plan is: waiting for its send time, then the steps of its order. */
export const planDayStatusSchema = z.enum(['scheduled', ...orderSteps]);
export type PlanDayStatus = z.infer<typeof planDayStatusSchema>;

export const planDaySchema = z.object({
  date: z.iso.date(),
  weekday: workdaySchema,
  suggestion: suggestionSchema,
  /** Whether the meal can still be swapped. The server decides, from the cutoff and its own clock. */
  canChange: z.boolean(),
  /** Only once the plan is confirmed. */
  status: planDayStatusSchema.optional(),
  /** The day's order, once it has gone to the restaurant. */
  orderId: z.string().optional(),
  /** When the order arrived, as "HH:mm". */
  deliveredAt: time24Schema.optional(),
});
export type PlanDay = z.infer<typeof planDaySchema>;

export const weeklyPlanSchema = z.object({
  id: z.string(),
  days: z.array(planDaySchema).min(1).max(5),
  budget: piastersSchema,
  /** Food plus the shared delivery for every day. */
  total: piastersSchema,
  /** What the user paid when confirming. Later swaps never cost more; a cheaper one is settled in phase 4. */
  paidTotal: piastersSchema.optional(),
  sharedDeliveryFee: piastersSchema,
  mealCalorieLimit: z.int().positive().optional(),
  breakTime: time24Schema,
  arrivalTime: time24Schema,
  /** When each day's order goes to the restaurant. */
  sendTime: time24Schema,
  changeCutoff: time24Schema,
  confirmed: z.boolean(),
});
export type WeeklyPlan = z.infer<typeof weeklyPlanSchema>;
