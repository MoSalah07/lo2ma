import { z } from 'zod';
import { piastersSchema, time24Schema } from './common.ts';
import { suggestionSchema } from './suggestion.ts';

/** Workdays in Egypt: Sunday to Thursday. */
export const workdaySchema = z.enum(['sun', 'mon', 'tue', 'wed', 'thu']);
export type Workday = z.infer<typeof workdaySchema>;

export const planDaySchema = z.object({
  date: z.iso.date(),
  weekday: workdaySchema,
  suggestion: suggestionSchema,
});
export type PlanDay = z.infer<typeof planDaySchema>;

export const weeklyPlanSchema = z.object({
  id: z.string(),
  days: z.array(planDaySchema).min(1).max(5),
  budget: piastersSchema,
  /** Food plus the shared delivery for every day. */
  total: piastersSchema,
  sharedDeliveryFee: piastersSchema,
  mealCalorieLimit: z.int().positive().optional(),
  breakTime: time24Schema,
  arrivalTime: time24Schema,
  changeCutoff: time24Schema,
  confirmed: z.boolean(),
});
export type WeeklyPlan = z.infer<typeof weeklyPlanSchema>;
