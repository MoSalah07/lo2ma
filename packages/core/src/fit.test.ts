import { describe, expect, it } from 'vitest';
import { calculateFit, fitGoalAllowed } from './fit.ts';
import { bodyProfileSchema, type BodyProfile } from './schemas/fit.ts';
import { caloriePrefSchema } from './schemas/prefs.ts';

/** The example on the design canvas: a man at a desk who trains 3 or 4 days a week. */
const officeMan: BodyProfile = {
  sex: 'male',
  age: 28,
  heightCm: 178,
  weightKg: 82,
  training: 'moderate',
};

const smallWoman: BodyProfile = {
  sex: 'female',
  age: 50,
  heightCm: 155,
  weightKg: 50,
  training: 'none',
};

describe('calculateFit', () => {
  it('gives the canvas example: 780 kcal and 57 g of protein for lunch when cutting', () => {
    expect(calculateFit(officeMan, 'cut')).toEqual({
      restKcal: 1798,
      trainingKcal: 2786,
      dailyKcal: 2230,
      raisedToFloor: false,
      dailyProtein: 164,
      lunch: { kcal: 780, protein: 57 },
    });
  });

  it('eats as much as it burns to keep, and 10% more to bulk', () => {
    expect(calculateFit(officeMan, 'keep')).toMatchObject({
      dailyKcal: 2790,
      lunch: { kcal: 980, protein: 46 },
    });
    expect(calculateFit(officeMan, 'bulk')).toMatchObject({
      dailyKcal: 3060,
      lunch: { kcal: 1070, protein: 52 },
    });
  });

  it('never lets a cutting day go under the floor, and says so', () => {
    expect(calculateFit(smallWoman, 'cut')).toMatchObject({
      dailyKcal: 1200,
      raisedToFloor: true,
      lunch: { kcal: 420, protein: 35 },
    });
  });

  it('keeps the floor for cutting only', () => {
    expect(calculateFit(smallWoman, 'keep')).toMatchObject({
      dailyKcal: 1270,
      raisedToFloor: false,
    });
  });
});

describe('fitGoalAllowed', () => {
  it('stops cutting under 18 and nothing else', () => {
    expect(fitGoalAllowed('cut', 17)).toBe(false);
    expect(fitGoalAllowed('cut', 18)).toBe(true);
    expect(fitGoalAllowed('keep', 16)).toBe(true);
    expect(fitGoalAllowed('bulk', 16)).toBe(true);
  });
});

describe('fit schemas', () => {
  it('stores a lunch goal, with or without the goal it came from', () => {
    expect(
      caloriePrefSchema.safeParse({ mode: 'fit', goal: 'cut', kcal: 780, protein: 57 }).success,
    ).toBe(true);
    expect(caloriePrefSchema.safeParse({ mode: 'fit', kcal: 650, protein: 40 }).success).toBe(true);
  });

  it('refuses a goal outside the steppers', () => {
    expect(caloriePrefSchema.safeParse({ mode: 'fit', kcal: 200, protein: 40 }).success).toBe(
      false,
    );
    expect(caloriePrefSchema.safeParse({ mode: 'fit', kcal: 700, protein: 200 }).success).toBe(
      false,
    );
  });

  it('checks the body profile the calculator takes', () => {
    expect(bodyProfileSchema.safeParse(officeMan).success).toBe(true);
    expect(bodyProfileSchema.safeParse({ ...officeMan, age: 12 }).success).toBe(false);
    expect(bodyProfileSchema.safeParse({ ...officeMan, weightKg: 82.5 }).success).toBe(false);
  });
});
