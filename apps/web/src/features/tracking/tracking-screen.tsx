'use client';

import {
  ARRIVAL_BUFFER_MINUTES,
  formatMoney,
  formatTime,
  minutesBetween,
  orderProgress,
} from '@lo2ma/core';
import { Phone, UserRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { iconButtonVariants } from '@/components/ui/icon-button';
import { Meter } from '@/components/ui/meter';
import { useOrder } from '@/features/orders/api';
import { cn } from '@/lib/cn';
import { mealName } from '@/lib/meal';
import { StatusTimeline } from './status-timeline';

const HELP_EMAIL = 'mailto:help@lo2ma.test';

export function TrackingScreen({ id }: { id: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const order = useOrder(id);

  if (order.isPending) return <LoadingBlocks count={3} />;
  if (order.isError) return <ErrorMessage onRetry={() => void order.refetch()} />;
  if (!order.data) return <ErrorMessage message={t('common.notFound')} />;

  const { suggestion, status } = order.data;
  const progress = orderProgress(status);
  const early = minutesBetween(order.data.arrivalTime, order.data.breakTime);

  return (
    <div className="flex flex-col gap-4 px-5 pb-8">
      <section
        aria-live="polite"
        className="flex flex-col gap-1.5 rounded-28 bg-primary p-5 text-on-primary"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-12 font-medium">
            {`${suggestion.restaurant.name[locale]} · ${mealName(suggestion, locale)}`}
          </span>
          {order.data.onTime && (
            <Badge tone="onPrimary" className="h-6 px-2.5">
              {t('tracking.onTime')}
            </Badge>
          )}
        </div>
        <p className="text-34 leading-heading font-extrabold">
          {status === 'delivered'
            ? t('tracking.delivered')
            : t('tracking.arrives', { time: formatTime(order.data.arrivalTime) })}
        </p>
        <p className="text-14 font-medium">
          {t('common.beforeBreak', { minutes: early > 0 ? early : ARRIVAL_BUFFER_MINUTES })}
        </p>
        <Meter value={progress} label={t('tracking.title')} tone="onPrimary" className="mt-2.5" />
      </section>

      <StatusTimeline order={order.data} />

      <Card className="flex items-center gap-3 rounded-22 px-3.5 py-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-tint text-primary-ink">
          <UserRound aria-hidden className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-14 font-semibold">{t('tracking.courier')}</span>
          <span className="text-12 text-muted">{t('tracking.courierNote')}</span>
        </div>
        {order.data.courierPhone ? (
          <a
            href={`tel:${order.data.courierPhone}`}
            aria-label={t('tracking.callCourier')}
            className={iconButtonVariants({ variant: 'tint' })}
          >
            <Phone aria-hidden className="size-4.5" />
          </a>
        ) : null}
      </Card>

      <a
        href={HELP_EMAIL}
        className={cn(buttonVariants({ variant: 'ghost', size: 'md' }), 'text-14')}
      >
        {t('tracking.help')}
      </a>
      <p className="text-center text-12 text-muted">
        {t('tracking.paid', { amount: formatMoney(suggestion.bill.total, locale) })}
      </p>
    </div>
  );
}
