import {
  addMinutes,
  ARRIVAL_BUFFER_MINUTES,
  PLAN_CHANGE_CUTOFF,
  SHARED_DELIVERY_FEE,
  type PlanDay,
  type UserPrefs,
  type WeeklyPlan,
  type Workday,
} from '@lo2ma/core';
import { http, HttpResponse } from 'msw';
import { suggestMeals } from '../engine/suggest';
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

/** Picks one meal for a day: within the per-day food budget, from a place and dish not used yet. */
function pickMeal(prefs: UserPrefs, used: Used) {
  return suggestMeals(
    {
      budget: Number.MAX_SAFE_INTEGER,
      foodMax: prefs.budget - SHARED_DELIVERY_FEE,
      exclusions: prefs.exclusions,
      caloriesMax: prefs.calories.mode === 'any' ? undefined : prefs.calories.kcal,
      skipRestaurants: used.restaurants,
      skipDishes: used.dishes,
    },
    1,
  )[0];
}

function summarize(prefs: UserPrefs, days: PlanDay[], confirmed = false): WeeklyPlan {
  const food = days.reduce((sum, day) => sum + day.suggestion.bill.food, 0);
  return {
    id: `plan-${days[0]?.date ?? 'empty'}`,
    days,
    budget: prefs.budget * WORKDAYS.length,
    total: food + SHARED_DELIVERY_FEE * days.length,
    sharedDeliveryFee: SHARED_DELIVERY_FEE,
    mealCalorieLimit: prefs.calories.mode === 'any' ? undefined : prefs.calories.kcal,
    breakTime: prefs.breakTime,
    arrivalTime: addMinutes(prefs.breakTime, -ARRIVAL_BUFFER_MINUTES),
    changeCutoff: PLAN_CHANGE_CUTOFF,
    confirmed,
  };
}

function buildPlan(prefs: UserPrefs): WeeklyPlan {
  const days: PlanDay[] = [];
  for (const { date, weekday } of nextWeek()) {
    const suggestion = pickMeal(prefs, usedIn(days));
    if (suggestion) days.push({ date, weekday, suggestion });
  }
  return summarize(prefs, days);
}

export const planHandlers = [
  http.get(route('/plan'), () => {
    const db = readDb();
    if (!db.prefs) return fail(404, 'not_onboarded');
    const plan = db.plan ?? buildPlan(db.prefs);
    writeDb((state) => ({ ...state, plan }));
    return HttpResponse.json(plan);
  }),

  http.post(route('/plan/days/:date/swap'), ({ params }) => {
    const { prefs, plan } = readDb();
    if (!prefs || !plan) return fail(404, 'plan_not_found');
    const used = usedIn(plan.days);
    const days = plan.days.map((day) => {
      if (day.date !== params.date) return day;
      const suggestion = pickMeal(prefs, used);
      return suggestion ? { ...day, suggestion } : day;
    });
    const next = summarize(prefs, days);
    writeDb((state) => ({ ...state, plan: next }));
    return HttpResponse.json(next);
  }),

  http.post(route('/plan/confirm'), () => {
    const { prefs, plan, session } = readDb();
    if (!session) return fail(401, 'auth_required');
    if (!prefs || !plan) return fail(404, 'plan_not_found');
    const next = summarize(prefs, plan.days, true);
    writeDb((state) => ({ ...state, plan: next }));
    return HttpResponse.json(next);
  }),
];
