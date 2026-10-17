// @vitest-environment node
import {
  adminChallengeSchema,
  adminOrdersPageSchema,
  adminOverviewSchema,
  adminUserSchema,
  agentConversationSchema,
  agentConversationSummarySchema,
  chatEventSchema,
  couponSchema,
  orderSchema,
  placeSchema,
  planDayBill,
  pointLookupSchema,
  SHARED_DELIVERY_FEE,
  transcriptionSchema,
  VOICE_MAX_BYTES,
  weeklyPlanSchema,
  type ChatEvent,
  type CreateCoupon,
  userPrefsSchema,
  type UserPrefs,
} from '@lo2ma/core';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { readSseEvents } from '@/lib/sse';
import { resetDb, writeDb } from '../store';
import { handlers } from './index';

// These tests pin the API contract that FastAPI must follow in phase 2.
const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterAll(() => server.close());
beforeEach(() => resetDb());

const call = (path: string, init?: { method?: string; body?: unknown }) =>
  fetch(`http://localhost/api${path}`, {
    method: init?.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });

const prefs: UserPrefs = {
  workplace: {
    name: { ar: 'القرية الذكية · مبنى B2', en: 'Smart Village · Building B2' },
    area: { ar: 'طريق مصر إسكندرية الصحراوي، الجيزة', en: 'Cairo–Alex Desert Road, Giza' },
    point: { lat: 30.0712, lng: 31.0175 },
    details: '',
  },
  breakTime: '13:30',
  budget: 15000,
  calories: { mode: 'any' },
  exclusions: ['chicken'],
};

async function signIn() {
  await call('/auth/verify', {
    method: 'POST',
    body: { channel: 'phone', destination: '1012345678', code: '482193' },
  });
}

describe('places', () => {
  const places = z.array(placeSchema);

  it('suggests popular workplaces, Smart Village first', async () => {
    const suggested = places.parse(await (await call('/places/suggested')).json());
    expect(suggested.length).toBeGreaterThan(3);
    expect(suggested[0]?.name.en).toContain('Smart Village');
  });

  it('finds places the way people type them, in either language', async () => {
    const search = async (q: string) =>
      places.parse(await (await call(`/places/search?${new URLSearchParams({ q })}`)).json());
    // No hamza, ه for ة, and the building in Latin letters: still B7.
    expect((await search('القريه الذكيه b7')).map(({ id }) => id)).toEqual(['sv-b7']);
    expect(await search('smart village')).toHaveLength(3);
    expect(await search('  ')).toEqual([]);
    expect(await search('Alexandria')).toEqual([]);
  });

  it('names what is under a pin, and says whether Lo2ma delivers there', async () => {
    const at = async (lat: number, lng: number) =>
      pointLookupSchema.parse(await (await call(`/places/reverse?lat=${lat}&lng=${lng}`)).json());
    expect(await at(30.07125, 31.01752)).toMatchObject({
      name: { en: 'Smart Village · Building B2' },
      inServiceArea: true,
    });
    // Off any building: the nearest district.
    expect((await at(30.065, 31.225)).name.en).toBe('Zamalek');
    expect((await at(30.011, 31.74)).inServiceArea).toBe(false);
  });

  it('refuses a point that is not one', async () => {
    const response = await call('/places/reverse?lat=95&lng=31');
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ code: 'invalid_point' });
  });
});

describe('preferences', () => {
  it('refuses a workplace Lo2ma does not deliver to yet', async () => {
    const newCapital = { ...prefs.workplace, point: { lat: 30.011, lng: 31.74 } };
    const response = await call('/prefs', {
      method: 'PUT',
      body: { ...prefs, workplace: newCapital },
    });
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ code: 'outside_service_area' });
  });

  it('brings back preferences saved before workplaces had a map point', async () => {
    const oldWorkplace = { id: 'sv-b7', name: { ar: 'مبنى B7', en: 'Building B7' } };
    writeDb((db) => ({
      ...db,
      prefs: { ...prefs, workplace: oldWorkplace } as unknown as UserPrefs,
    }));
    const saved = userPrefsSchema.parse(await (await call('/prefs')).json());
    expect(saved.workplace).toMatchObject({
      name: { en: 'Smart Village · Building B7' },
      point: { lat: 30.0722, lng: 31.016 },
    });
    expect(saved.budget).toBe(prefs.budget);
  });
});

describe('POST /api/chat/transcribe', () => {
  /** A voice message as the browser sends it: multipart, with the audio file and the page language. */
  function transcribe(audio: Blob, locale: string) {
    const form = new FormData();
    form.append('audio', audio, 'voice');
    form.append('locale', locale);
    return fetch('http://localhost/api/chat/transcribe', { method: 'POST', body: form });
  }

  it('writes down what was said, for the user to check', async () => {
    for (const locale of ['ar', 'en']) {
      const response = await transcribe(new Blob(['voice'], { type: 'audio/webm' }), locale);
      expect(transcriptionSchema.parse(await response.json()).text).not.toBe('');
    }
  });

  it('treats an empty recording as silence', async () => {
    const response = await transcribe(new Blob([], { type: 'audio/webm' }), 'ar');
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ code: 'no_speech' });
  });

  it('refuses a recording far bigger than a minute of speech', async () => {
    const huge = new Blob([new Uint8Array(VOICE_MAX_BYTES + 1)], { type: 'audio/webm' });
    const response = await transcribe(huge, 'ar');
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ code: 'audio_too_large' });
  });
});

describe('POST /api/chat', () => {
  it('streams the reply word by word, then the suggestions, then done', async () => {
    const response = await call('/chat', {
      method: 'POST',
      body: { message: 'معايا 200 جنيه، ومش عايز فراخ', locale: 'ar' },
    });
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    const events: ChatEvent[] = [];
    if (response.body)
      for await (const event of readSseEvents(response.body, chatEventSchema)) events.push(event);

    const tokens = events.filter((event) => event.type === 'token');
    expect(tokens.length).toBeGreaterThan(3);
    expect(tokens.map((event) => event.text).join('')).toContain('لقيت');

    const suggestions = events.find((event) => event.type === 'suggestions');
    expect(suggestions?.type === 'suggestions' && suggestions.suggestions).toHaveLength(3);
    expect(events.at(-1)).toEqual({ type: 'done' });
  });

  it('asks for a budget when it has none', async () => {
    const response = await call('/chat', { method: 'POST', body: { message: 'hi', locale: 'en' } });
    const events: ChatEvent[] = [];
    if (response.body)
      for await (const event of readSseEvents(response.body, chatEventSchema)) events.push(event);
    const text = events.flatMap((event) => (event.type === 'token' ? [event.text] : [])).join('');
    expect(text).toContain('budget');
  });
});

describe('orders', () => {
  it('refuses to order before signing in', async () => {
    const response = await call('/orders', {
      method: 'POST',
      body: { suggestionId: 'r01.m1.m3', paymentMethod: 'card' },
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ code: 'auth_required' });
  });

  it('creates an order that arrives 15 minutes before the break', async () => {
    await signIn();
    await call('/prefs', { method: 'PUT', body: prefs });
    const response = await call('/orders', {
      method: 'POST',
      body: { suggestionId: 'r01.m1.m3', paymentMethod: 'card' },
    });
    expect(response.status).toBe(201);
    const order = orderSchema.parse(await response.json());
    expect(order.arrivalTime).toBe('13:15');
    expect(order.suggestion.bill.total).toBe(15000);
    expect(order.timeline.map((step) => step.status)).toEqual([
      'sent',
      'accepted',
      'preparing',
      'onTheWay',
      'delivered',
    ]);
    expect((await call(`/orders/${order.id}`)).status).toBe(200);
  });
});

describe('auth', () => {
  it('rejects a phone number that is not Egyptian', async () => {
    const response = await call('/auth/otp', {
      method: 'POST',
      body: { channel: 'phone', destination: '12345' },
    });
    expect(response.status).toBe(400);
  });

  it('rejects the demo "wrong" code and accepts any other', async () => {
    const wrong = await call('/auth/verify', {
      method: 'POST',
      body: { channel: 'phone', destination: '01012345678', code: '000000' },
    });
    expect(await wrong.json()).toEqual({ code: 'invalid_code' });
    await signIn();
    expect((await call('/auth/session')).status).toBe(200);
  });
});

describe('weekly plan', () => {
  it('needs onboarding first', async () => {
    expect((await call('/plan')).status).toBe(404);
  });

  it('plans Sunday to Thursday at different restaurants within the daily food budget', async () => {
    await call('/prefs', { method: 'PUT', body: prefs });
    const plan = weeklyPlanSchema.parse(await (await call('/plan')).json());

    expect(plan.days.map((day) => day.weekday)).toEqual(['sun', 'mon', 'tue', 'wed', 'thu']);
    const places = new Set(plan.days.map((day) => day.suggestion.restaurant.id));
    expect(places.size).toBe(5);
    const dishes = new Set(plan.days.map((day) => day.suggestion.items[0]?.name.en));
    expect(dishes.size).toBe(5);
    const food = plan.days.reduce((sum, day) => sum + day.suggestion.bill.food, 0);
    expect(plan.total).toBe(food + SHARED_DELIVERY_FEE * 5);
    for (const day of plan.days) {
      expect(day.suggestion.bill.food).toBeLessThanOrEqual(prefs.budget - SHARED_DELIVERY_FEE);
    }
  });

  it('swaps one day for another restaurant', async () => {
    await call('/prefs', { method: 'PUT', body: prefs });
    const plan = weeklyPlanSchema.parse(await (await call('/plan')).json());
    const sunday = plan.days[0];
    const swapped = weeklyPlanSchema.parse(
      await (await call(`/plan/days/${sunday?.date}/swap`, { method: 'POST' })).json(),
    );
    expect(swapped.days[0]?.suggestion.restaurant.id).not.toBe(sunday?.suggestion.restaurant.id);
  });
});

describe('confirmed plan', () => {
  // Only Date is faked, so MSW's own timers keep running.
  const setNow = (iso: string) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(iso));
  };
  afterEach(() => vi.useRealTimers());

  /** Plans and pays on Thursday 15 October, so the plan covers Sunday 18 to Thursday 22. */
  async function confirmNextWeek() {
    setNow('2026-10-15T10:00:00');
    await call('/prefs', { method: 'PUT', body: prefs });
    await call('/plan');
    await signIn();
    await call('/plan/confirm', { method: 'POST' });
  }

  it('moves each day along with the clock and sends its order', async () => {
    await confirmNextWeek();
    setNow('2026-10-20T12:50:00'); // Tuesday, while lunch is being prepared.

    const plan = weeklyPlanSchema.parse(await (await call('/plan')).json());
    expect(plan.sendTime).toBe('12:30');
    expect(plan.days.map((day) => day.status)).toEqual([
      'delivered',
      'delivered',
      'preparing',
      'scheduled',
      'scheduled',
    ]);
    expect(plan.days.map((day) => day.canChange)).toEqual([false, false, false, true, true]);

    const today = plan.days[2];
    const order = orderSchema.parse(await (await call(`/orders/${today?.orderId}`)).json());
    expect(order.status).toBe('preparing');
    expect(order.suggestion.id).toBe(today?.suggestion.id);
    // The plan's own price: the food plus the shared delivery, as paid.
    expect(order.suggestion.bill).toEqual(planDayBill(today?.suggestion.bill.food ?? 0));

    const orders = z.array(orderSchema).parse(await (await call('/orders')).json());
    expect(orders.map((item) => item.id)).toEqual(['PL-20261020', 'PL-20261019', 'PL-20261018']);
  });

  it('swaps a paid day for one that costs no more, and refuses one after the cutoff', async () => {
    await confirmNextWeek();
    setNow('2026-10-20T11:45:00'); // Tuesday, past the 11:30 cutoff.
    const plan = weeklyPlanSchema.parse(await (await call('/plan')).json());

    const locked = await call(`/plan/days/${plan.days[2]?.date}/swap`, { method: 'POST' });
    expect(locked.status).toBe(409);
    expect(await locked.json()).toEqual({ code: 'day_locked' });

    const wednesday = plan.days[3];
    const swapped = weeklyPlanSchema.parse(
      await (await call(`/plan/days/${wednesday?.date}/swap`, { method: 'POST' })).json(),
    );
    expect(swapped.confirmed).toBe(true);
    expect(swapped.paidTotal).toBe(plan.paidTotal);
    expect(swapped.days[3]?.suggestion.bill.food).toBeLessThanOrEqual(
      wednesday?.suggestion.bill.food ?? 0,
    );
  });

  it('keeps the paid week as it was when the preferences change', async () => {
    await confirmNextWeek();
    await call('/prefs', { method: 'PUT', body: { ...prefs, breakTime: '14:00' } });
    setNow('2026-10-20T12:50:00');

    const plan = weeklyPlanSchema.parse(await (await call('/plan')).json());
    expect(plan.breakTime).toBe('13:30');
    expect(plan.days[2]?.status).toBe('preparing');
  });

  it('plans the next week once the paid one is over', async () => {
    await confirmNextWeek();
    setNow('2026-10-23T10:00:00'); // Friday, after the last planned day.

    const plan = weeklyPlanSchema.parse(await (await call('/plan')).json());
    expect(plan.confirmed).toBe(false);
    expect(plan.days[0]?.date).toBe('2026-10-25');
  });

  it('refuses a draft whose days have started, and plans a fresh week instead', async () => {
    setNow('2026-10-15T10:00:00');
    await call('/prefs', { method: 'PUT', body: prefs });
    await call('/plan');
    await signIn();
    setNow('2026-10-19T15:00:00'); // Monday afternoon: Sunday and Monday are gone.

    const late = await call('/plan/confirm', { method: 'POST' });
    expect(late.status).toBe(409);
    expect(await late.json()).toEqual({ code: 'plan_expired' });

    const plan = weeklyPlanSchema.parse(await (await call('/plan')).json());
    expect(plan.days[0]?.date).toBe('2026-10-25');
  });
});

describe('admin API', () => {
  const credentials = { email: 'admin@lo2ma.test', password: 'correct horse' };

  async function challenge() {
    const response = await call('/admin/auth/sign-in', { method: 'POST', body: credentials });
    return adminChallengeSchema.parse(await response.json()).challenge;
  }

  async function signInAdmin() {
    return call('/admin/auth/verify', {
      method: 'POST',
      body: { challenge: await challenge(), code: '482193' },
    });
  }

  it('signs in with a password, then an authenticator code', async () => {
    const response = await signInAdmin();
    expect(adminUserSchema.parse(await response.json()).email).toBe('admin@lo2ma.test');
    expect((await call('/admin/auth/session')).status).toBe(200);
  });

  it('rejects other emails, short passwords and the demo wrong code', async () => {
    for (const body of [
      { email: 'someone@example.com', password: 'correct horse' },
      { email: 'admin@lo2ma.test', password: 'short' },
    ]) {
      const response = await call('/admin/auth/sign-in', { method: 'POST', body });
      expect(await response.json()).toEqual({ code: 'invalid_credentials' });
    }
    const wrong = await call('/admin/auth/verify', {
      method: 'POST',
      body: { challenge: await challenge(), code: '000000' },
    });
    expect(await wrong.json()).toEqual({ code: 'invalid_code' });
  });

  it('keeps admin data away from customers and guests', async () => {
    await signIn();
    expect((await call('/admin/overview')).status).toBe(401);
    expect((await call('/admin/orders')).status).toBe(401);
    expect((await call('/admin/coupons', { method: 'POST', body: {} })).status).toBe(401);
  });

  it('serves the overview, the orders and the agent log', async () => {
    await signInAdmin();
    adminOverviewSchema.parse(await (await call('/admin/overview?range=week')).json());

    const page = adminOrdersPageSchema.parse(
      await (await call('/admin/orders?status=delivered&page=2')).json(),
    );
    expect(page.page).toBe(2);
    expect(page.items.every((order) => order.status === 'delivered')).toBe(true);

    const list = agentConversationSummarySchema
      .array()
      .parse(await (await call('/admin/agent/conversations?filter=issues')).json());
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((conversation) => conversation.hasIssue)).toBe(true);

    const detail = agentConversationSchema.parse(
      await (await call(`/admin/agent/conversations/${list[0]?.id}`)).json(),
    );
    expect(detail.steps.length).toBeGreaterThan(0);
  });

  it('saves a coupon for a company and refuses a duplicate code', async () => {
    await signInAdmin();
    const coupon: CreateCoupon = {
      code: 'LUNCH15',
      discount: { type: 'percent', value: 15, cap: 3000 },
      minOrder: 10000,
      audience: { type: 'company', companyId: 'c1' },
      limit: 500,
      perCustomer: 1,
      endsOn: '2999-11-30',
    };
    const created = await call('/admin/coupons', { method: 'POST', body: coupon });
    expect(created.status).toBe(201);
    expect(couponSchema.parse(await created.json()).audience).toMatchObject({
      type: 'company',
      company: { id: 'c1' },
    });

    const again = await call('/admin/coupons', { method: 'POST', body: coupon });
    expect(await again.json()).toEqual({ code: 'duplicate_code' });

    const all = couponSchema.array().parse(await (await call('/admin/coupons')).json());
    expect(all[0]?.code).toBe('LUNCH15');
  });
});
