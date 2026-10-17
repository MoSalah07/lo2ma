import {
  arrivalTimeFor,
  canChangePlanDay,
  PLAN_CHANGE_CUTOFF,
  planChangeDeadline,
  planSendTimeFor,
  SHARED_DELIVERY_FEE,
  weeklyPlanTotal,
  type PlanDay,
  type UserPrefs,
  type WeeklyPlan,
  type Workday,
} from '@lo2ma/core';
import { http, HttpResponse } from 'msw';
import { isOver, withProgress } from '../engine/plan-progress';
import { calorieFilter, suggestMeals } from '../engine/suggest';
import { readDb, writeDb } from '../store';
import { fail, route } from './respond';

const WORKDAYS: Workday[] = ['sun', 'mon', 'tue', 'wed', 'thu'];
const pad = (value: number) => String(value).padStart(2, '0');
const isoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Sunday to Thursday of next week. */
function nextWeek(today = new Date()): { date: string; weekday: Workday }[] {
  const sunday = new Date(today);
  sunday.setDate(today.getDate() + ((7 - today.getDay()) % 7 || 7));
  return WORKDAYS.map((weekday, index) => {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + index);
    return { date: isoDate(day), weekday };
  });
}

interface Used {
  restaurants: Set<string>;
  dishes: Set<string>;
}

/** Restaurants and main dishes already in the plan, so the week has variety. */
function usedIn(days: readonly PlanDay[]): Used {
  return {
    restaurants: new Set(days.map((day) => day.suggestion.restaurant.id)),
    dishes: new Set(days.flatMap((day) => day.suggestion.items[0]?.name.en ?? [])),
  };
}

/** Picks one meal for a day: within the food budget, from a place and dish not used yet. */
function pickMeal(prefs: UserPrefs, used: Used, foodMax = prefs.budget - SHARED_DELIVERY_FEE) {
  return suggestMeals(
    {
      budget: Number.MAX_SAFE_INTEGER,
      foodMax,
      exclusions: prefs.exclusions,
      ...calorieFilter(prefs.calories),
      skipRestaurants: used.restaurants,
      skipDishes: used.dishes,
    },
    1,
  )[0];
}

const foodsOf = (days: readonly PlanDay[]) => days.map((day) => day.suggestion.bill.food);

/** A draft follows the latest preferences: the budget, the break time and the calorie limit. */
function summarize(prefs: UserPrefs, days: PlanDay[]): WeeklyPlan {
  const arrivalTime = arrivalTimeFor(prefs.breakTime);
  return {
    id: `plan-${days[0]?.date ?? 'empty'}`,
    days,
    budget: prefs.budget * WORKDAYS.length,
    total: weeklyPlanTotal(foodsOf(days)),
    sharedDeliveryFee: SHARED_DELIVERY_FEE,
    // A fit goal isn't a limit; the plan screen shows the week's average against it instead.
    mealCalorieLimit: calorieFilter(prefs.calories).caloriesMax,
    breakTime: prefs.breakTime,
    arrivalTime,
    sendTime: planSendTimeFor(arrivalTime),
    changeCutoff: PLAN_CHANGE_CUTOFF,
    confirmed: false,
  };
}

function buildPlan(prefs: UserPrefs): WeeklyPlan {
  const days: PlanDay[] = [];
  for (const { date, weekday } of nextWeek()) {
    const suggestion = pickMeal(prefs, usedIn(days));
    if (suggestion) days.push({ date, weekday, suggestion, canChange: true });
  }
  return summarize(prefs, days);
}

const deadlineOf = (plan: WeeklyPlan) => planChangeDeadline(plan.sendTime, plan.changeCutoff);

/** A draft can be confirmed only while every one of its days can still be planned. */
const isOpen = (plan: WeeklyPlan) =>
  plan.days.every((day) => canChangePlanDay(day.date, new Date(), deadlineOf(plan)));

/** Plans saved by an older version of the demo miss the newer fields. */
function upgrade(saved: WeeklyPlan): WeeklyPlan {
  const { sendTime, paidTotal } = saved as Partial<WeeklyPlan>;
  return {
    ...saved,
    sendTime: sendTime ?? planSendTimeFor(saved.arrivalTime),
    paidTotal: paidTotal ?? saved.total,
  };
}

/**
 * The plan to show. A paid week keeps its own times and amount until it is over. A draft follows the
 * latest preferences, and is planned again once one of its days can no longer be.
 */
function currentPlan(prefs: UserPrefs, saved: WeeklyPlan | null): WeeklyPlan {
  if (saved?.confirmed && !isOver(saved)) return upgrade(saved);
  if (saved && !saved.confirmed) {
    const draft = summarize(prefs, saved.days);
    if (isOpen(draft)) return draft;
  }
  return buildPlan(prefs);
}

/** Saves the plan and answers with it as the clock has moved it. */
function respondWith(plan: WeeklyPlan) {
  writeDb((state) => ({ ...state, plan }));
  return HttpResponse.json(withProgress(plan));
}

export const planHandlers = [
  http.get(route('/plan'), () => {
    const { prefs, plan } = readDb();
    if (!prefs) return fail(404, 'not_onboarded');
    return respondWith(currentPlan(prefs, plan));
  }),

  http.post(route('/plan/days/:date/swap'), ({ params }) => {
    const { prefs, plan: saved } = readDb();
    if (!prefs || !saved) return fail(404, 'plan_not_found');
    const plan = currentPlan(prefs, saved);
    const date = String(params.date);
    const day = plan.days.find((item) => item.date === date);
    if (!day) return fail(404, 'day_not_found');
    if (!canChangePlanDay(date, new Date(), deadlineOf(plan))) return fail(409, 'day_locked');

    // A paid day is only swapped for a meal that costs the same or less.
    const foodMax = plan.confirmed ? day.suggestion.bill.food : undefined;
    const suggestion = pickMeal(prefs, usedIn(plan.days), foodMax);
    const days = plan.days.map((item) =>
      item.date === date && suggestion ? { ...item, suggestion } : item,
    );
    return respondWith(
      plan.confirmed
        ? { ...plan, days, total: weeklyPlanTotal(foodsOf(days)) }
        : summarize(prefs, days),
    );
  }),

  http.post(route('/plan/confirm'), () => {
    const { prefs, plan: saved, session } = readDb();
    if (!session) return fail(401, 'auth_required');
    if (!prefs || !saved) return fail(404, 'plan_not_found');
    if (saved.confirmed) return respondWith(upgrade(saved));

    const draft = summarize(prefs, saved.days);
    if (!isOpen(draft)) return fail(409, 'plan_expired');
    return respondWith({ ...draft, confirmed: true, paidTotal: draft.total });
  }),
];
