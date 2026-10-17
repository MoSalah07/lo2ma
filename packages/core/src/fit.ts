// «وضع الفورمة»: works out a lunch goal (calories and protein) from a body profile. It runs on the phone, so the
// weight and height never leave it; the server only gets the goal (FitTarget in schemas/fit.ts).
import {
  FIT_LUNCH_LIMITS,
  type BodyProfile,
  type FitGoal,
  type FitTarget,
  type TrainingDays,
} from './schemas/fit.ts';

/** Lunch is this share of the day's calories and protein: the main meal of an office day. */
export const LUNCH_SHARE = 0.35;

/** Cutting means eating less, which a growing body shouldn't do. */
export const FIT_MIN_CUT_AGE = 18;

/** A cutting day never goes under this many calories without a doctor. */
export const FIT_DAILY_FLOOR = { male: 1500, female: 1200 } as const;

/** Calories burned in a day for each answer to «بتتمرن كام يوم في الأسبوع؟», on top of sitting at a desk. */
export const TRAINING_FACTORS: Record<TrainingDays, number> = {
  none: 1.2,
  light: 1.375,
  moderate: 1.55,
  heavy: 1.725,
};

/** How the day's calories move for each goal: 20% less to cut, 10% more to bulk. */
export const GOAL_FACTORS: Record<FitGoal, number> = { cut: 0.8, keep: 1, bulk: 1.1 };

/** Protein per kilogram of body weight for each goal. */
export const PROTEIN_PER_KG: Record<FitGoal, number> = { cut: 2, keep: 1.6, bulk: 1.8 };

/** Every step of the calculation, so the screen can show how the goal came out («ازاي حسبناها»). */
export interface FitCalculation {
  /** Burned at rest (Mifflin-St Jeor). */
  restKcal: number;
  /** With training. */
  trainingKcal: number;
  /** After the goal, rounded to 10, and never under the floor when cutting. */
  dailyKcal: number;
  /** True when cutting would have gone under FIT_DAILY_FLOOR. */
  raisedToFloor: boolean;
  dailyProtein: number;
  lunch: FitTarget;
}

const roundTo10 = (kcal: number) => Math.round(kcal / 10) * 10;

/** Whether this goal is safe at this age. Only cutting has a minimum. */
export function fitGoalAllowed(goal: FitGoal, age: number): boolean {
  return goal !== 'cut' || age >= FIT_MIN_CUT_AGE;
}

export function calculateFit(profile: BodyProfile, goal: FitGoal): FitCalculation {
  const { sex, age, heightCm, weightKg, training } = profile;
  const restKcal = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
  const trainingKcal = restKcal * TRAINING_FACTORS[training];

  const floor = FIT_DAILY_FLOOR[sex];
  const goalKcal = roundTo10(trainingKcal * GOAL_FACTORS[goal]);
  const raisedToFloor = goal === 'cut' && goalKcal < floor;
  const dailyKcal = raisedToFloor ? floor : goalKcal;
  const dailyProtein = Math.round(weightKg * PROTEIN_PER_KG[goal]);

  return {
    restKcal: Math.round(restKcal),
    trainingKcal: Math.round(trainingKcal),
    dailyKcal,
    raisedToFloor,
    dailyProtein,
    lunch: {
      kcal: roundTo10(dailyKcal * LUNCH_SHARE),
      protein: Math.round(dailyProtein * LUNCH_SHARE),
    },
  };
}

const clamp = (value: number, { min, max }: { min: number; max: number }) =>
  Math.min(max, Math.max(min, value));

/** Keeps a goal inside the steppers' limits: a big bulk can work out above what the server stores. */
export function clampFitTarget({ kcal, protein }: FitTarget): FitTarget {
  return {
    kcal: clamp(kcal, FIT_LUNCH_LIMITS.kcal),
    protein: clamp(protein, FIT_LUNCH_LIMITS.protein),
  };
}
