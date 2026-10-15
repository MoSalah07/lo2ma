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
  SHARED_DELIVERY_FEE,
  weeklyPlanSchema,
  type ChatEvent,
  type CreateCoupon,
  type UserPrefs,
} from '@lo2ma/core';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readSseEvents } from '@/lib/sse';
import { resetDb } from '../store';
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
    id: 'sv-b2',
    name: { ar: 'القرية الذكية · مبنى B2', en: 'Smart Village · Building B2' },
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
