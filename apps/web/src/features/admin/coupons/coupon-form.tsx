'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { formatMoney, fromPounds, MIN_ORDER, toIsoDate } from '@lo2ma/core';
import { TicketPercent } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input, inputClass } from '@/components/ui/field';
import { segmentedItem } from '@/components/ui/segmented';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useCompanies, useCreateCoupon } from '../api';
import {
  couponFormDefaults,
  couponFormSchema,
  generateCode,
  toCreateCoupon,
  type CouponErrorKey,
  type CouponFormValues,
} from './coupon-form-schema';

/** An input with a unit after it («%», «ج»), drawn as one field. */
function WithUnit({ unit, children }: { unit: string; children: ReactNode }) {
  return (
    <div className="flex h-12 items-center gap-1.5 rounded-16 bg-surface-2 pe-3.5">
      {children}
      <span aria-hidden className="text-13 text-muted">
        {unit}
      </span>
    </div>
  );
}

const unitInput = 'h-11 min-w-0 flex-1 bg-transparent px-3.5 text-14';

/** The «كوبون جديد» panel: every rule the API checks is checked here first, in the admin's language. */
export function CouponForm() {
  // react-hook-form's register() refreshes each input through a ref callback on every render. The React
  // Compiler would cache those callbacks, so reset() after saving would leave the old text on screen.
  'use no memo';
  const t = useTranslations('admin');
  const tFormat = useTranslations('format');
  const locale = useLocale();
  const companies = useCompanies();
  const createCoupon = useCreateCoupon();
  const [savedCode, setSavedCode] = useState<string>();
  const today = toIsoDate();

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema(today)),
    defaultValues: couponFormDefaults,
  });
  const { register, handleSubmit, setValue, setError, reset, control } = form;
  const { errors } = form.formState;
  const [code, type, value, cap, audience] = useWatch({
    control,
    name: ['code', 'type', 'value', 'cap', 'audience'],
  });

  const money = (pounds: string) => formatMoney(fromPounds(Number(pounds)), locale);
  const errorText = (key: string | undefined) =>
    key &&
    t(`coupons.errors.${key as CouponErrorKey | 'duplicate'}`, {
      amount: formatMoney(MIN_ORDER, locale),
    });

  const submit = handleSubmit((values) => {
    setSavedCode(undefined);
    createCoupon.mutate(toCreateCoupon(values), {
      onSuccess: (coupon) => {
        reset(couponFormDefaults);
        setSavedCode(coupon.code);
      },
      onError: (error) => {
        if (error instanceof ApiError && error.code === 'duplicate_code') {
          setError('code', { message: 'duplicate' });
        }
      },
    });
  });

  const previewReady = Number(value) > 0 && (type === 'amount' || Number(cap) > 0);

  return (
    <Card className="flex flex-col gap-4 rounded-26 p-5">
      <h2 id="new-coupon" tabIndex={-1} className="text-18 font-bold outline-none">
        {t('coupons.new')}
      </h2>

      <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-4">
        <Field label={t('coupons.code')} error={errorText(errors.code?.message)}>
          {(field) => (
            <div className="flex gap-2">
              <Input
                {...field}
                {...register('code')}
                dir="ltr"
                autoCapitalize="characters"
                spellCheck={false}
                className="min-w-0 flex-1 font-mono text-14 font-semibold uppercase"
              />
              <Button
                variant="tonal"
                size="sm"
                className="h-12"
                onClick={() => setValue('code', generateCode(), { shouldValidate: true })}
              >
                {t('coupons.generate')}
              </Button>
            </div>
          )}
        </Field>

        <div role="group" aria-labelledby="coupon-type" className="flex flex-col gap-2">
          <span id="coupon-type" className="text-13 font-semibold text-ink-2">
            {t('coupons.type')}
          </span>
          <div className="grid grid-cols-2 gap-0.5 rounded-full bg-surface-2 p-0.5">
            {(['percent', 'amount'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={type === option}
                onClick={() => setValue('type', option)}
                className={segmentedItem({ active: type === option })}
              >
                {t(`coupons.${option}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label={t('coupons.value')} error={errorText(errors.value?.message)}>
            {(field) => (
              <WithUnit unit={type === 'percent' ? '%' : tFormat('currency')}>
                <Input
                  {...field}
                  {...register('value')}
                  inputMode="decimal"
                  className={unitInput}
                />
              </WithUnit>
            )}
          </Field>
          {type === 'percent' && (
            <Field label={t('coupons.cap')} error={errorText(errors.cap?.message)}>
              {(field) => (
                <WithUnit unit={tFormat('currency')}>
                  <Input
                    {...field}
                    {...register('cap')}
                    inputMode="decimal"
                    className={unitInput}
                  />
                </WithUnit>
              )}
            </Field>
          )}
        </div>

        <Field
          label={t('coupons.minOrder')}
          hint={t('coupons.minHint', { amount: formatMoney(MIN_ORDER, locale) })}
          error={errorText(errors.minOrder?.message)}
        >
          {(field) => (
            <WithUnit unit={tFormat('currency')}>
              <Input
                {...field}
                {...register('minOrder')}
                inputMode="decimal"
                className={unitInput}
              />
            </WithUnit>
          )}
        </Field>

        <fieldset className="flex flex-col gap-0.5">
          <legend className="pb-1.5 text-13 font-semibold text-ink-2">{t('coupons.who')}</legend>
          {(['all', 'company', 'new'] as const).map((option) => (
            <label key={option} className="flex h-11 items-center gap-2.5 text-14">
              <input
                type="radio"
                value={option}
                {...register('audience')}
                className="size-5 accent-primary"
              />
              {t(
                `coupons.${option === 'all' ? 'whoAll' : option === 'new' ? 'whoNew' : 'whoCompany'}`,
              )}
            </label>
          ))}
        </fieldset>

        {audience === 'company' && (
          <Field label={t('table.company')} error={errorText(errors.companyId?.message)}>
            {(field) => (
              <select {...field} {...register('companyId')} className={cn(inputClass, 'text-14')}>
                <option value="" />
                {companies.data?.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name[locale]}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <Field
            label={t('coupons.uses')}
            hint={t('coupons.usesHint')}
            error={errorText(errors.limit?.message)}
          >
            {(field) => (
              <Input {...field} {...register('limit')} inputMode="numeric" className="text-14" />
            )}
          </Field>
          <Field label={t('coupons.perCustomer')} error={errorText(errors.perCustomer?.message)}>
            {(field) => (
              <Input
                {...field}
                {...register('perCustomer')}
                inputMode="numeric"
                className="text-14"
              />
            )}
          </Field>
        </div>

        <Field label={t('coupons.endsOn')} error={errorText(errors.endsOn?.message)}>
          {(field) => (
            <Input {...field} {...register('endsOn')} type="date" min={today} className="text-14" />
          )}
        </Field>

        <div className="flex flex-col gap-2 rounded-18 bg-surface-2 p-3.5">
          <span className="text-12 text-muted">{t('coupons.preview')}</span>
          {(code || previewReady) && (
            <Badge tone="pink" size="md" className="h-8 gap-2 self-start px-3 text-13">
              <TicketPercent aria-hidden className="size-4" />
              {code && <bdi dir="ltr">{code.toUpperCase()}</bdi>}
              {code && previewReady && <span aria-hidden>·</span>}
              {previewReady &&
                (type === 'percent'
                  ? t('coupons.previewPercent', { value, cap: money(cap) })
                  : t('coupons.previewAmount', { amount: money(value) }))}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="md" className="flex-1" disabled={createCoupon.isPending}>
            {t('coupons.save')}
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              reset(couponFormDefaults);
              setSavedCode(undefined);
            }}
          >
            {t('coupons.cancel')}
          </Button>
        </div>
        <p role="status" className="min-h-5 text-13 text-on-good">
          {savedCode && t('coupons.saved', { code: savedCode })}
        </p>
      </form>
    </Card>
  );
}
