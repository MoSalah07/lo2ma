'use client';

import { formatMoney, type OrderStatus } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { MealIcon } from '@/components/meal-icon';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { focusRing } from '@/components/ui/focus';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { mealName } from '@/lib/meal';
import { useOrders } from './api';

const statusTone: Record<OrderStatus, BadgeProps['tone']> = {
  sent: 'tint',
  accepted: 'tint',
  preparing: 'lilac',
  onTheWay: 'inverse',
  delivered: 'good',
};

/** Past and current orders. A simple list until the P2 «الأوردرات القديمة» screen is designed. */
export function OrdersScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const orders = useOrders();

  return (
    <>
      <header className="px-5 pt-5 pb-3">
        <h1 className="text-26 leading-heading font-extrabold">{t('orders.title')}</h1>
      </header>
      <div className="flex flex-col gap-2 px-4 pb-32">
        {orders.isPending && <LoadingBlocks count={3} />}
        {orders.isError && <ErrorMessage onRetry={() => void orders.refetch()} />}
        {orders.data?.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-15 text-ink-2">{t('orders.empty')}</p>
            <Link href="/chat" className={buttonVariants({ size: 'md' })}>
              {t('orders.startChat')}
            </Link>
          </div>
        )}
        <ul className="flex flex-col gap-2">
          {orders.data?.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-22 bg-surface px-3.5 py-3 shadow-card',
                  focusRing,
                )}
              >
                <MealIcon size="sm" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-14 font-semibold">
                    {mealName(order.suggestion, locale)}
                  </span>
                  <bdi dir="ltr" className="text-start text-12 text-muted">{`#${order.id}`}</bdi>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-15 font-extrabold">
                    {formatMoney(order.suggestion.bill.total, locale)}
                  </span>
                  <Badge tone={statusTone[order.status]}>
                    {t(`tracking.steps.${order.status}`)}
                  </Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
