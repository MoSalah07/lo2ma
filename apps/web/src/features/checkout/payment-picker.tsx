'use client';

import type { PaymentMethod } from '@lo2ma/core';
import { CreditCard, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaymentMethods } from '@/features/orders/api';

interface PaymentPickerProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

/** Saved payment methods as real radio buttons, so arrow keys and screen readers work. */
export function PaymentPicker({ value, onChange }: PaymentPickerProps) {
  const t = useTranslations();
  const methods = usePaymentMethods();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="pb-2 text-13 font-semibold text-ink-2">
        {t('checkout.paymentTitle')}
      </legend>
      <Card className="rounded-24 px-4 py-1">
        {methods.isPending && <Skeleton className="my-3 h-12" />}
        <div className="divide-y divide-divider">
          {methods.data?.map((option) => {
            const Icon = option.method === 'card' ? CreditCard : Wallet;
            return (
              <label key={option.method} className="flex h-15 cursor-pointer items-center gap-3">
                <span className="flex size-9.5 shrink-0 items-center justify-center rounded-12 bg-surface-2">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="flex-1 text-14 font-semibold">
                  {option.method === 'card'
                    ? t('payment.card', { last4: option.last4 ?? '' })
                    : t('payment.wallet')}
                </span>
                <input
                  type="radio"
                  name="payment-method"
                  value={option.method}
                  checked={value === option.method}
                  onChange={() => onChange(option.method)}
                  className="size-5.5 accent-primary"
                />
              </label>
            );
          })}
        </div>
      </Card>
    </fieldset>
  );
}
