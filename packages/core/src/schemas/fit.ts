import { z } from 'zod';

/** «تنشيف», «ثبات», «تضخيم». */
export const fitGoalSchema = z.enum(['cut', 'keep', 'bulk']);
export type FitGoal = z.infer<typeof fitGoalSchema>;

export const sexSchema = z.enum(['male', 'female']);
export type Sex = z.infer<typeof sexSchema>;

/** «بتتمرن كام يوم في الأسبوع؟»: none, 1–2, 3–4, 5 or more. */
export const trainingDaysSchema = z.enum(['none', 'light', 'moderate', 'heavy']);
export type TrainingDays = z.infer<typeof trainingDaysSchema>;

/** The limits of the goal steppers, which the server enforces too. */
export const FIT_LUNCH_LIMITS = {
  kcal: { min: 300, max: 1500, step: 50 },
  protein: { min: 10, max: 120, step: 5 },
} as const;

/** A lunch goal: what the server stores and the meals are matched against. */
export const fitTargetSchema = z.object({
  kcal: z.int().min(FIT_LUNCH_LIMITS.kcal.min).max(FIT_LUNCH_LIMITS.kcal.max),
  protein: z.int().min(FIT_LUNCH_LIMITS.protein.min).max(FIT_LUNCH_LIMITS.protein.max),
});
export type FitTarget = z.infer<typeof fitTargetSchema>;

/** What the calculator's number fields accept. */
export const BODY_LIMITS = {
  age: { min: 14, max: 90 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 35, max: 250 },
} as const;

const within = ({ min, max }: { min: number; max: number }) => z.int().min(min).max(max);

/** The calculator's form. It stays on the phone; only the goal it gives reaches the server. */
export const bodyProfileSchema = z.object({
  sex: sexSchema,
  age: within(BODY_LIMITS.age),
  heightCm: within(BODY_LIMITS.heightCm),
  weightKg: within(BODY_LIMITS.weightKg),
  training: trainingDaysSchema,
});
export type BodyProfile = z.infer<typeof bodyProfileSchema>;
