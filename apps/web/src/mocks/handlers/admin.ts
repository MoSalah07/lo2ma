import {
  adminOrdersQuerySchema,
  adminSignInSchema,
  adminVerifySchema,
  agentFilterSchema,
  createCouponSchema,
  overviewRangeSchema,
  toIsoDate,
  type AdminUser,
  type Coupon,
  type CreateCoupon,
} from '@lo2ma/core';
import { http, HttpResponse } from 'msw';
import { companies, companyById, conversations, demoAdmin } from '../data/admin';
import { exportOrders, overview, queryOrders } from '../engine/admin';
import { readDb, writeDb } from '../store';
import { fail, readBody, route } from './respond';

// Demo rules: any @lo2ma.test email with a password of 8+ characters passes the first step. Any 6-digit
// code passes the second, except 000000, which shows the "wrong code" state.
const ADMIN_DOMAIN = '@lo2ma.test';
const MIN_PASSWORD = 8;
const WRONG_CODE = '000000';

/** Every data endpoint needs a signed-in admin; customers' sessions don't count. */
function withAdmin(handler: (request: Request, params: Record<string, string>) => Response) {
  return ({ request, params }: { request: Request; params: Record<string, unknown> }) =>
    readDb().adminSession
      ? handler(request, params as Record<string, string>)
      : fail(401, 'admin_required');
}

const searchParams = (request: Request) => Object.fromEntries(new URL(request.url).searchParams);

function toCoupon(input: CreateCoupon): Coupon | null {
  const { audience } = input;
  if (audience.type !== 'company') return { ...input, audience, used: 0, status: 'active' };
  const company = companyById.get(audience.companyId);
  return company
    ? { ...input, audience: { type: 'company', company }, used: 0, status: 'active' }
    : null;
}

export const adminHandlers = [
  http.post(route('/admin/auth/sign-in'), async ({ request }) => {
    const body = await readBody(request, adminSignInSchema);
    const email = body?.email.toLowerCase();
    if (!body || !email?.endsWith(ADMIN_DOMAIN) || body.password.length < MIN_PASSWORD) {
      return fail(401, 'invalid_credentials');
    }
    const challenge = { id: crypto.randomUUID(), email };
    writeDb((state) => ({ ...state, adminChallenge: challenge }));
    return HttpResponse.json({ challenge: challenge.id });
  }),

  http.post(route('/admin/auth/verify'), async ({ request }) => {
    const body = await readBody(request, adminVerifySchema);
    const { adminChallenge } = readDb();
    if (!body || body.challenge !== adminChallenge?.id) return fail(400, 'invalid_challenge');
    if (body.code === WRONG_CODE) return fail(400, 'invalid_code');

    const admin: AdminUser = { ...demoAdmin, email: adminChallenge.email };
    writeDb((state) => ({ ...state, adminSession: admin, adminChallenge: null }));
    return HttpResponse.json(admin);
  }),

  http.get(route('/admin/auth/session'), () => {
    const { adminSession } = readDb();
    return adminSession ? HttpResponse.json(adminSession) : fail(401, 'signed_out');
  }),

  http.post(route('/admin/auth/sign-out'), () => {
    writeDb((state) => ({ ...state, adminSession: null }));
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(
    route('/admin/overview'),
    withAdmin((request) => {
      const range = overviewRangeSchema.safeParse(searchParams(request).range);
      return HttpResponse.json(overview(new Date(), range.success ? range.data : 'today'));
    }),
  ),

  http.get(
    route('/admin/orders'),
    withAdmin((request) => {
      const query = adminOrdersQuerySchema.safeParse(searchParams(request));
      return query.success
        ? HttpResponse.json(queryOrders(new Date(), query.data))
        : fail(400, 'invalid_query');
    }),
  ),

  http.get(
    route('/admin/orders/export'),
    withAdmin((request) => {
      const query = adminOrdersQuerySchema.safeParse(searchParams(request));
      return query.success
        ? HttpResponse.json(exportOrders(new Date(), query.data))
        : fail(400, 'invalid_query');
    }),
  ),

  http.get(
    route('/admin/companies'),
    withAdmin(() => HttpResponse.json(companies)),
  ),

  http.get(
    route('/admin/coupons'),
    withAdmin(() => HttpResponse.json(readDb().coupons)),
  ),

  http.post(route('/admin/coupons'), async ({ request }) => {
    if (!readDb().adminSession) return fail(401, 'admin_required');
    const body = await readBody(request, createCouponSchema);
    if (!body) return fail(400, 'invalid_coupon');
    if (body.endsOn < toIsoDate()) return fail(400, 'ends_in_past');
    if (readDb().coupons.some((coupon) => coupon.code === body.code)) {
      return fail(409, 'duplicate_code');
    }
    const coupon = toCoupon(body);
    if (!coupon) return fail(400, 'unknown_company');
    writeDb((state) => ({ ...state, coupons: [coupon, ...state.coupons] }));
    return HttpResponse.json(coupon, { status: 201 });
  }),

  http.get(
    route('/admin/agent/conversations'),
    withAdmin((request) => {
      const params = searchParams(request);
      const filter = agentFilterSchema.catch('all').parse(params.filter);
      const q = (params.q ?? '').trim().toLowerCase();
      const list = conversations
        .filter((conversation) =>
          filter === 'issues'
            ? conversation.hasIssue
            : filter === 'ordered'
              ? conversation.outcome === 'ordered'
              : true,
        )
        .filter(
          (conversation) =>
            !q ||
            conversation.firstMessage.toLowerCase().includes(q) ||
            (conversation.customer ?? '').toLowerCase().includes(q),
        )
        .map(({ id, customer, startedAt, firstMessage, outcome, cost, hasIssue }) => ({
          id,
          customer,
          startedAt,
          firstMessage,
          outcome,
          cost,
          hasIssue,
        }));
      return HttpResponse.json(list);
    }),
  ),

  http.get(
    route('/admin/agent/conversations/:id'),
    withAdmin((_request, params) => {
      const conversation = conversations.find((candidate) => candidate.id === params.id);
      return conversation ? HttpResponse.json(conversation) : fail(404, 'not_found');
    }),
  ),
];
