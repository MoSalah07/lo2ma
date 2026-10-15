import {
  COUPON_CODE,
  fromPounds,
  MAX_PERCENT_OFF,
  MIN_ORDER,
  type CreateCoupon,
} from '@lo2ma/core';
import { z } from 'zod';

/** What the form holds: text, exactly as typed. `toCreateCoupon` turns it into the API's shape. */
export const couponFormDefaults = {
  code: '',
  type: 'percent' as 'percent' | 'amount',
  value: '',
  cap: '',
  minOrder: String(MIN_ORDER / 100),
  audience: 'all' as 'all' | 'company' | 'new',
  companyId: '',
  limit: '',
  perCustomer: '1',
  endsOn: '',
};
export type CouponFormValues = typeof couponFormDefaults;

/** Error messages are keys under admin.coupons.errors, so the form can show them in either language. */
export type CouponErrorKey =
  'code' | 'value' | 'percent' | 'minOrder' | 'count' | 'company' | 'ends';

const pounds = (text: string) => (/^\d+(\.\d{1,2})?$/.test(text) ? Number(text) : Number.NaN);
const count = (text: string) => (/^\d+$/.test(text) ? Number(text) : Number.NaN);

/** Checks the form against the same rules the API enforces. `today` is "YYYY-MM-DD". */
export const couponFormSchema = (today: string) =>
  z
    .object({
      code: z.string().trim().toUpperCase(),
      type: z.enum(['percent', 'amount']),
      value: z.string().trim(),
      cap: z.string().trim(),
      minOrder: z.string().trim(),
      audience: z.enum(['all', 'company', 'new']),
      companyId: z.string(),
      limit: z.string().trim(),
      perCustomer: z.string().trim(),
      endsOn: z.string(),
    })
    .superRefine((form, ctx) => {
      const fail = (path: keyof CouponFormValues, message: CouponErrorKey) =>
        ctx.addIssue({ code: 'custom', path: [path], message });

      if (!COUPON_CODE.test(form.code)) fail('code', 'code');
      if (form.type === 'percent') {
        const value = count(form.value);
        if (!(value >= 1 && value <= MAX_PERCENT_OFF)) fail('value', 'percent');
        if (!(pounds(form.cap) > 0)) fail('cap', 'value');
      } else if (!(pounds(form.value) > 0)) {
        fail('value', 'value');
      }
      if (!(fromPounds(pounds(form.minOrder)) >= MIN_ORDER)) fail('minOrder', 'minOrder');
      if (form.audience === 'company' && !form.companyId) fail('companyId', 'company');
      if (form.limit && !(count(form.limit) > 0)) fail('limit', 'count');
      if (!(count(form.perCustomer) > 0)) fail('perCustomer', 'count');
      if (!form.endsOn || form.endsOn < today) fail('endsOn', 'ends');
    });

/** The checked form as the API wants it: money in piasters, no limit as null. */
export function toCreateCoupon(form: CouponFormValues): CreateCoupon {
  return {
    code: form.code,
    discount:
      form.type === 'percent'
        ? { type: 'percent', value: Number(form.value), cap: fromPounds(Number(form.cap)) }
        : { type: 'amount', value: fromPounds(Number(form.value)) },
    minOrder: fromPounds(Number(form.minOrder)),
    audience:
      form.audience === 'company'
        ? { type: 'company', companyId: form.companyId }
        : { type: form.audience },
    limit: form.limit ? Number(form.limit) : null,
    perCustomer: Number(form.perCustomer),
    endsOn: form.endsOn,
  };
}

const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** A random 8-character code without look-alike letters (no O/0, I/1). */
export function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => CODE_LETTERS[byte % CODE_LETTERS.length]).join('');
}
