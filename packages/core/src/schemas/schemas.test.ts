import { describe, expect, it } from 'vitest';
import {
  agentStepSchema,
  agentToolSchema,
  createCouponSchema,
  type CreateCoupon,
} from './admin.ts';
import { chatEventSchema } from './chat.ts';
import { isVegetarian } from './food.ts';
import { userPrefsSchema } from './prefs.ts';
import { suggestionSchema, type Suggestion } from './suggestion.ts';

const koshari: Suggestion = {
  id: 's1',
  restaurant: {
    id: 'r01',
    name: { ar: 'بيت الكشري', en: 'Beit El Koshari' },
    distanceKm: 1.2,
    etaMinutes: 15,
    deliveryFee: 2000,
  },
  items: [
    {
      id: 'm1',
      restaurantId: 'r01',
      name: { ar: 'كشري كبير', en: 'Large koshari' },
      price: 9500,
      kcal: 900,
      kcalSource: 'ai',
      contains: [],
      quantity: 1,
    },
  ],
  bill: { food: 9500, delivery: 2000, service: 1000, total: 12500 },
  kcal: 900,
  kcalSource: 'ai',
  bestValue: true,
};

describe('suggestionSchema', () => {
  it('accepts a suggestion shaped like the chat screen', () => {
    expect(suggestionSchema.parse(koshari)).toEqual(koshari);
  });

  it('rejects money that is not whole piasters', () => {
    const broken = { ...koshari, bill: { ...koshari.bill, total: 125.5 } };
    expect(suggestionSchema.safeParse(broken).success).toBe(false);
  });

  it('needs at least one dish', () => {
    expect(suggestionSchema.safeParse({ ...koshari, items: [] }).success).toBe(false);
  });
});

describe('userPrefsSchema', () => {
  const prefs = {
    workplace: {
      name: { ar: 'القرية الذكية · مبنى B2', en: 'Smart Village · Building B2' },
      area: { ar: 'أبو رواش، الجيزة', en: 'Abu Rawash, Giza' },
      point: { lat: 30.0717, lng: 31.0167 },
      details: 'الدور التالت',
    },
    breakTime: '13:30',
    budget: 15000,
    calories: { mode: 'around', kcal: 700 },
    exclusions: ['chicken'],
  };

  it('accepts the onboarding example', () => {
    expect(userPrefsSchema.safeParse(prefs).success).toBe(true);
  });

  it('refuses a budget under the minimum order', () => {
    expect(userPrefsSchema.safeParse({ ...prefs, budget: 9000 }).success).toBe(false);
  });

  it('needs the workplace on the map, not only its name', () => {
    const { name, area, details } = prefs.workplace;
    const unplaced = { name, area, details };
    expect(userPrefsSchema.safeParse({ ...prefs, workplace: unplaced }).success).toBe(false);
  });

  it('refuses a point off the earth, and courier notes longer than the limit', () => {
    const at = (point: object) => ({ ...prefs, workplace: { ...prefs.workplace, point } });
    expect(userPrefsSchema.safeParse(at({ lat: 91, lng: 31 })).success).toBe(false);
    const long = { ...prefs, workplace: { ...prefs.workplace, details: 'x'.repeat(121) } };
    expect(userPrefsSchema.safeParse(long).success).toBe(false);
  });

  it('trims the courier notes', () => {
    const padded = { ...prefs, workplace: { ...prefs.workplace, details: '  الدور التالت  ' } };
    expect(userPrefsSchema.parse(padded).workplace.details).toBe('الدور التالت');
  });

  it('refuses a break time that is not HH:mm', () => {
    expect(userPrefsSchema.safeParse({ ...prefs, breakTime: '1:30' }).success).toBe(false);
  });
});

describe('chatEventSchema', () => {
  it('reads each event type by its "type" field', () => {
    expect(chatEventSchema.parse({ type: 'token', text: 'لقيت ' })).toEqual({
      type: 'token',
      text: 'لقيت ',
    });
    expect(chatEventSchema.parse({ type: 'done' })).toEqual({ type: 'done' });
    expect(chatEventSchema.safeParse({ type: 'unknown' }).success).toBe(false);
  });
});

describe('isVegetarian', () => {
  it('allows dairy and nuts but not meat or fish', () => {
    expect(isVegetarian({ contains: ['dairy', 'nuts'] })).toBe(true);
    expect(isVegetarian({ contains: ['dairy', 'chicken'] })).toBe(false);
    expect(isVegetarian({ contains: ['fish'] })).toBe(false);
  });
});

describe('createCouponSchema', () => {
  const coupon: CreateCoupon = {
    code: 'LUNCH15',
    discount: { type: 'percent', value: 15, cap: 3000 },
    minOrder: 10000,
    audience: { type: 'all' },
    limit: 500,
    perCustomer: 1,
    endsOn: '2026-11-30',
  };

  it('accepts a coupon like the one in the admin form', () => {
    expect(createCouponSchema.parse(coupon)).toEqual(coupon);
  });

  it('never lets a coupon go under the minimum order', () => {
    expect(createCouponSchema.safeParse({ ...coupon, minOrder: 9900 }).success).toBe(false);
  });

  it('keeps percentages between 1 and 90 and codes to capital letters and digits', () => {
    const tooMuch = { ...coupon, discount: { type: 'percent', value: 95, cap: 3000 } };
    expect(createCouponSchema.safeParse(tooMuch).success).toBe(false);
    expect(createCouponSchema.safeParse({ ...coupon, code: 'lunch 15' }).success).toBe(false);
  });
});

describe('agentStepSchema', () => {
  it('only knows tools that cannot pay', () => {
    expect(agentToolSchema.options).not.toContain('confirm_order');
    expect(
      agentStepSchema.safeParse({ kind: 'tool', tool: 'pay', ms: 10, results: 0 }).success,
    ).toBe(false);
  });
});
