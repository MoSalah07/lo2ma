import { z } from 'zod';
import { MIN_ORDER } from '../rules.ts';
import { OTP_LENGTH } from './auth.ts';
import { localizedTextSchema, piastersSchema, time24Schema } from './common.ts';

// The admin dashboard's API. Admins sign in separately from customers: email + password, then an
// authenticator code.

export const adminSignInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type AdminSignIn = z.infer<typeof adminSignInSchema>;

/** The password step returns a short-lived challenge; the code step sends it back. */
export const adminChallengeSchema = z.object({ challenge: z.string() });

export const adminVerifySchema = z.object({
  challenge: z.string(),
  code: z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`)),
});
export type AdminVerify = z.infer<typeof adminVerifySchema>;

export const adminUserSchema = z.object({ id: z.string(), name: z.string(), email: z.email() });
export type AdminUser = z.infer<typeof adminUserSchema>;

/** A calendar day, "YYYY-MM-DD". */
export const isoDateSchema = z.iso.date();

/** The statuses the operations team sees. «late» and «rejected» never reach the customer's timeline. */
export const adminOrderStatuses = [
  'new',
  'preparing',
  'onTheWay',
  'delivered',
  'late',
  'rejected',
] as const;
export const adminOrderStatusSchema = z.enum(adminOrderStatuses);
export type AdminOrderStatus = z.infer<typeof adminOrderStatusSchema>;

export const companySchema = z.object({ id: z.string(), name: localizedTextSchema });
export type Company = z.infer<typeof companySchema>;

export const adminOrderSchema = z.object({
  id: z.string(),
  date: isoDateSchema,
  /** As the customer typed it, in any language. */
  customer: z.string(),
  /** Null for people who order on their own, without a company. */
  company: companySchema.nullable(),
  restaurant: localizedTextSchema,
  total: piastersSchema,
  breakTime: time24Schema,
  status: adminOrderStatusSchema,
});
export type AdminOrder = z.infer<typeof adminOrderSchema>;

export const ADMIN_PAGE_SIZE = 10;

export const adminOrdersQuerySchema = z.object({
  q: z.string().optional(),
  company: z.string().optional(),
  status: adminOrderStatusSchema.optional(),
  /** "YYYY-MM". */
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
  page: z.coerce.number().int().positive().optional(),
});
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;

export const adminOrdersPageSchema = z.object({
  items: z.array(adminOrderSchema),
  /** The month shown, "YYYY-MM": the one asked for, or the latest one. */
  month: z.string(),
  page: z.int().positive(),
  pageCount: z.int().nonnegative(),
  total: z.int().nonnegative(),
  /** How many orders each status chip would show, with the other filters applied. */
  counts: z.record(z.enum(['all', ...adminOrderStatuses]), z.int().nonnegative()),
});
export type AdminOrdersPage = z.infer<typeof adminOrdersPageSchema>;

export const overviewRanges = ['today', 'week', 'month'] as const;
export const overviewRangeSchema = z.enum(overviewRanges);
export type OverviewRange = z.infer<typeof overviewRangeSchema>;

/** A headline number and how it moved against the previous period of the same length. */
const kpiSchema = z.object({ value: z.int(), change: z.int() });

export const adminOverviewSchema = z.object({
  range: overviewRangeSchema,
  /** The latest workday, which «today» means on a weekend too. */
  day: isoDateSchema,
  updatedAt: time24Schema,
  kpis: z.object({
    /** Change in percent. */
    orders: kpiSchema,
    /** Piasters; change in percent. */
    revenue: kpiSchema,
    /** Percent of orders that arrived before the break; change in percentage points. */
    onTime: kpiSchema,
    /** Piasters per order; change in piasters. */
    aiCost: kpiSchema,
  }),
  /** The last 10 workdays, oldest first. */
  daily: z.array(z.object({ date: isoDateSchema, orders: z.int().nonnegative() })),
  slots: z.array(z.object({ breakTime: time24Schema, orders: z.int().nonnegative() })),
  /** Orders that share a company and a break time go out in one trip. */
  batch: z.object({ orders: z.int().nonnegative(), trips: z.int().nonnegative() }),
  recent: z.array(adminOrderSchema),
});
export type AdminOverview = z.infer<typeof adminOverviewSchema>;

// Coupons -------------------------------------------------------------------------------------------

export const COUPON_CODE = /^[A-Z0-9]{4,16}$/;
export const MAX_PERCENT_OFF = 90;

export const couponDiscountSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('percent'),
    value: z.int().min(1).max(MAX_PERCENT_OFF),
    /** The most the percentage can take off, in piasters. */
    cap: piastersSchema.positive(),
  }),
  z.object({ type: z.literal('amount'), value: piastersSchema.positive() }),
]);
export type CouponDiscount = z.infer<typeof couponDiscountSchema>;

export const couponAudienceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('all') }),
  z.object({ type: z.literal('new') }),
  z.object({ type: z.literal('company'), company: companySchema }),
]);
export type CouponAudience = z.infer<typeof couponAudienceSchema>;

export const createCouponSchema = z.object({
  code: z.string().regex(COUPON_CODE),
  discount: couponDiscountSchema,
  /** A coupon can't lower Lo2ma's minimum order. */
  minOrder: piastersSchema.min(MIN_ORDER),
  audience: z.discriminatedUnion('type', [
    z.object({ type: z.literal('all') }),
    z.object({ type: z.literal('new') }),
    z.object({ type: z.literal('company'), companyId: z.string() }),
  ]),
  /** Null means no limit. */
  limit: z.int().positive().nullable(),
  perCustomer: z.int().positive(),
  endsOn: isoDateSchema,
});
export type CreateCoupon = z.infer<typeof createCouponSchema>;

export const couponStatusSchema = z.enum(['active', 'paused', 'ended']);
export type CouponStatus = z.infer<typeof couponStatusSchema>;

export const couponSchema = createCouponSchema.extend({
  audience: couponAudienceSchema,
  used: z.int().nonnegative(),
  status: couponStatusSchema,
});
export type Coupon = z.infer<typeof couponSchema>;

// Agent log -----------------------------------------------------------------------------------------

/** "HH:mm:ss". */
const clockSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/);

export const agentOutcomeSchema = z.enum(['ordered', 'plan', 'noResults', 'noOrder']);
export type AgentOutcome = z.infer<typeof agentOutcomeSchema>;

/** The tools the agent may call. None of them can confirm or pay for an order. */
export const agentToolSchema = z.enum(['search_menu', 'estimate_calories', 'plan_week']);
export type AgentTool = z.infer<typeof agentToolSchema>;

export const agentStepSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('user'), at: clockSchema, text: z.string() }),
  z.object({
    kind: z.literal('understand'),
    tokens: z.int().nonnegative(),
    ms: z.int().nonnegative(),
    /** What the model extracted, shown as JSON. */
    parsed: z.record(z.string(), z.unknown()),
  }),
  z.object({
    kind: z.literal('tool'),
    tool: agentToolSchema,
    /** The call as the model made it, shown as code. */
    call: z.string().optional(),
    ms: z.int().nonnegative(),
    results: z.int().nonnegative(),
  }),
  z.object({
    kind: z.literal('reply'),
    tokens: z.int().nonnegative(),
    ms: z.int().nonnegative(),
    text: z.string(),
  }),
  z.object({
    kind: z.literal('confirmed'),
    at: clockSchema,
    orderId: z.string(),
    total: piastersSchema,
  }),
]);
export type AgentStep = z.infer<typeof agentStepSchema>;

export const agentConversationSummarySchema = z.object({
  id: z.string(),
  /** Null for guests. */
  customer: z.string().nullable(),
  startedAt: time24Schema,
  firstMessage: z.string(),
  outcome: agentOutcomeSchema,
  /** Piasters. */
  cost: piastersSchema,
  /** A tool failed, found nothing, or the reply broke a rule. */
  hasIssue: z.boolean(),
});
export type AgentConversationSummary = z.infer<typeof agentConversationSummarySchema>;

export const agentConversationSchema = agentConversationSummarySchema.extend({
  model: z.string(),
  tokens: z.int().nonnegative(),
  ms: z.int().nonnegative(),
  orderId: z.string().optional(),
  steps: z.array(agentStepSchema),
});
export type AgentConversation = z.infer<typeof agentConversationSchema>;

export const agentFilterSchema = z.enum(['all', 'issues', 'ordered']);
export type AgentFilter = z.infer<typeof agentFilterSchema>;
