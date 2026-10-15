import { COUPON_CODE, createCouponSchema } from '@lo2ma/core';
import { describe, expect, it } from 'vitest';
import {
  couponFormDefaults,
  couponFormSchema,
  generateCode,
  toCreateCoupon,
  type CouponFormValues,
} from './coupon-form-schema';

const today = '2026-10-15';
const filled: CouponFormValues = {
  ...couponFormDefaults,
  code: 'lunch15',
  value: '15',
  cap: '30',
  endsOn: '2026-11-30',
};

const errorsOf = (form: CouponFormValues): Record<string, string> => {
  const result = couponFormSchema(today).safeParse(form);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
  );
};

describe('couponFormSchema', () => {
  it('accepts the example from the design and turns it into what the API expects', () => {
    const parsed = couponFormSchema(today).parse(filled);
    const coupon = toCreateCoupon(parsed);
    expect(coupon).toEqual({
      code: 'LUNCH15',
      discount: { type: 'percent', value: 15, cap: 3000 },
      minOrder: 10000,
      audience: { type: 'all' },
      limit: null,
      perCustomer: 1,
      endsOn: '2026-11-30',
    });
    expect(createCouponSchema.safeParse(coupon).success).toBe(true);
  });

  it('never lets a coupon lower the minimum order', () => {
    expect(errorsOf({ ...filled, minOrder: '99' })).toEqual({ minOrder: 'minOrder' });
  });

  it('names each broken field with its message key', () => {
    expect(
      errorsOf({
        ...filled,
        code: 'no',
        value: '95',
        cap: '',
        audience: 'company',
        limit: '0',
        perCustomer: '',
        endsOn: '2026-10-14',
      }),
    ).toEqual({
      code: 'code',
      value: 'percent',
      cap: 'value',
      companyId: 'company',
      limit: 'count',
      perCustomer: 'count',
      endsOn: 'ends',
    });
  });

  it('takes a fixed amount in pounds, with piasters', () => {
    const parsed = couponFormSchema(today).parse({ ...filled, type: 'amount', value: '12.50' });
    expect(toCreateCoupon(parsed).discount).toEqual({ type: 'amount', value: 1250 });
  });
});

describe('generateCode', () => {
  it('makes codes the API accepts', () => {
    expect(generateCode()).toMatch(COUPON_CODE);
  });
});
