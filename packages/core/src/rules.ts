import { calculateBill, type Bill } from './bill.ts';
import { toIsoDate } from './dates.ts';
import { fromPounds, type Piasters } from './money.ts';
import { addMinutes, timeOf } from './time.ts';

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

/** A planned day's order goes to the restaurant this many minutes before it should arrive. */
export const PLAN_SEND_LEAD_MINUTES = 45;

/** A voice message is at most a minute; recording stops on its own there. */
export const VOICE_MAX_SECONDS = 60;

/** Anything shorter than a second is treated as a slip of the finger, not a message. */
export const VOICE_MIN_SECONDS = 1;

/**
 * The biggest recording the server takes, in bytes. A minute of speech is about 1 MB at the browsers' usual
 * bitrates, so this only stops an upload that went wrong. Bigger ones get `413 audio_too_large`.
 */
export const VOICE_MAX_BYTES = 4 * 1024 * 1024;

/**
 * Where Lo2ma delivers for now: Greater Cairo, as a circle around Tahrir Square wide enough for Smart Village,
 * Sheikh Zayed, 6th of October and New Cairo. Further out (the New Capital, Alexandria) is «not yet».
 */
export const SERVICE_AREA = {
  center: { lat: 30.0444, lng: 31.2357 },
  radiusMeters: 35_000,
} as const;

/** A restaurant delivers to workplaces this close to it, in meters. */
export const DELIVERY_RADIUS_METERS = 5_000;

/** The most a user can write for the courier about their workplace (building, floor, a landmark). */
export const WORKPLACE_DETAILS_MAX = 120;

/** When lunch should arrive for a break: "13:30" → "13:15". */
export function arrivalTimeFor(breakTime: string): string {
  return addMinutes(breakTime, -ARRIVAL_BUFFER_MINUTES);
}

/** When a planned day's order goes to the restaurant: "13:15" → "12:30". */
export function planSendTimeFor(arrivalTime: string): string {
  return addMinutes(arrivalTime, -PLAN_SEND_LEAD_MINUTES);
}

/** The last moment a planned day can change: the morning cutoff, or earlier if its order goes out first. */
export function planChangeDeadline(sendTime: string, cutoff: string = PLAN_CHANGE_CUTOFF): string {
  return sendTime < cutoff ? sendTime : cutoff;
}

/** Whether a planned day can still be swapped at `now`: any later day, or the same day before the deadline. */
export function canChangePlanDay(
  date: string,
  now: Date = new Date(),
  deadline: string = PLAN_CHANGE_CUTOFF,
): boolean {
  const today = toIsoDate(now);
  return date > today || (date === today && timeOf(now) < deadline);
}

/** One day of a weekly plan: its food plus the delivery shared with coworkers, and no service fee. */
export function planDayBill(food: Piasters): Bill {
  return calculateBill({
    items: [{ price: food, quantity: 1 }],
    delivery: SHARED_DELIVERY_FEE,
    service: 0,
  });
}

/** What a weekly plan costs, from the food of each day. */
export function weeklyPlanTotal(dayFoods: readonly Piasters[]): Piasters {
  return dayFoods.reduce((sum, food) => sum + planDayBill(food).total, 0);
}

export function meetsMinimumOrder(foodSubtotal: Piasters): boolean {
  return foodSubtotal >= MIN_ORDER;
}
