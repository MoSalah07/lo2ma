import { fromPounds, weeklyPlanTotal, type Piasters, type Workday } from '@lo2ma/core';

// A fixed example for the landing page, with the same meals, week and prices as the designs.
// The page shows it to explain the product; it is not live data.

export const sampleMeal = {
  total: fromPounds(150),
  kcal: 720,
  breakTime: '13:30',
};

interface SampleDay {
  weekday: Workday;
  date: string;
  food: Piasters;
}

const days: SampleDay[] = [
  { weekday: 'sun', date: '2026-10-18', food: fromPounds(105) },
  { weekday: 'mon', date: '2026-10-19', food: fromPounds(100) },
  { weekday: 'tue', date: '2026-10-20', food: fromPounds(130) },
  { weekday: 'wed', date: '2026-10-21', food: fromPounds(120) },
  { weekday: 'thu', date: '2026-10-22', food: fromPounds(145) },
];

export const sampleWeek = {
  days,
  budget: fromPounds(700),
  total: weeklyPlanTotal(days.map((day) => day.food)),
  breakTime: '13:30',
};
