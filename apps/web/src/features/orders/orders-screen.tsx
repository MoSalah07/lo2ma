'use client';

import { formatMoney, type OrderStatus } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { MealIcon } from '@/components/meal-icon';
import { Screen, ScreenHeader } from '@/components/screen';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { focusRing } from '@/components/ui/focus';
import { Sequence, SequenceItem } from '@/components/motion/entrance';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { mealName } from '@/lib/meal';
import { useOrders } from './api';

const statusTone: Record<OrderStatus, BadgeProps['tone']> = {
  sent: 'tint',
  accepted: 'tint',
  preparing: 'accent',
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
      <ScreenHeader title={t('orders.title')} />
      <Screen clear="nav" className="gap-list">
        {orders.isPending && <LoadingBlocks count={3} />}
        {orders.isError && <ErrorMessage onRetry={() => void orders.refetch()} />}
        {orders.data?.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-body-md text-ink-2">{t('orders.empty')}</p>
            <Link href="/chat" className={buttonVariants({ size: 'md' })}>
              {t('orders.startChat')}
            </Link>
          </div>
        )}
        <Sequence as="ul" className="flex flex-col gap-list">
          {orders.data?.map((order) => (
            <li key={order.id}>
              <SequenceItem>
                <Link
                  href={`/orders/${order.id}`}
                  className={cn(
                    'flex items-center gap-3 rounded-card bg-surface px-3.5 py-3 shadow-card',
                    focusRing,
                  )}
                >
                  <MealIcon size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-label-lg">
                      <bdi>{mealName(order.suggestion, locale)}</bdi>
                    </span>
                    <bdi
                      dir="ltr"
                      className="text-start text-caption text-muted"
                    >{`#${order.id}`}</bdi>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-body-md font-extrabold">
                      {formatMoney(order.suggestion.bill.total, locale)}
                    </span>
                    <Badge tone={statusTone[order.status]}>
                      {t(`tracking.steps.${order.status}`)}
                    </Badge>
                  </span>
                </Link>
              </SequenceItem>
            </li>
          ))}
        </Sequence>
      </Screen>
    </>
  );
}
