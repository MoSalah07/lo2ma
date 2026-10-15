'use client';

import {
  formatMoney,
  formatNumber,
  formatTime,
  overviewRanges,
  weekdayOf,
  type AdminOverview,
  type OverviewRange,
} from '@lo2ma/core';
import { ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { segmentedItem, segmentedRoot } from '@/components/ui/segmented';
import { Link } from '@/i18n/navigation';
import { useOverview } from '../api';
import { OrdersTable } from '../orders-table';
import { PageHeader } from '../page-header';
import { ThemeToggle } from '../theme-toggle';
import { KpiTile } from './kpi-tile';
import { OrdersChart } from './orders-chart';
import { SlotsCard } from './slots-card';

type Kpi = keyof AdminOverview['kpis'];
const kpiOrder: Kpi[] = ['orders', 'revenue', 'onTime', 'aiCost'];
/** For every number but the AI cost, going up is good news. */
const upIsGood: Record<Kpi, boolean> = { orders: true, revenue: true, onTime: true, aiCost: false };

export function OverviewScreen() {
  const t = useTranslations('admin');
  const tFormat = useTranslations('format');
  const tWeekdays = useTranslations('weekdays');
  const locale = useLocale();
  const [range, setRange] = useState<OverviewRange>('today');
  const overview = useOverview(range);
  const data = overview.data;

  const percent = (value: number) => tFormat('percent', { value: formatNumber(value, locale) });

  function kpiTile(kpi: Kpi, { kpis, day }: AdminOverview) {
    const { value, change } = kpis[kpi];
    const size = Math.abs(change);
    const shown = {
      orders: { value: formatNumber(value, locale), change: percent(size) },
      revenue: { value: formatMoney(value, locale), change: percent(size) },
      onTime: { value: percent(value), change: t('overview.points', { count: size }) },
      aiCost: { value: formatMoney(value, locale), change: formatMoney(size, locale) },
    }[kpi];
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
    return (
      <KpiTile
        key={kpi}
        label={t(`overview.${kpi}`)}
        value={shown.value}
        change={
          range === 'today'
            ? t('overview.changeToday', { change: shown.change, day: tWeekdays(weekdayOf(day)) })
            : t('overview.change', { change: shown.change })
        }
        direction={direction}
        directionLabel={direction === 'flat' ? undefined : t(`overview.${direction}`)}
        good={change >= 0 === upIsGood[kpi]}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={t('overview.title')}
        subtitle={data && t('overview.updated', { time: formatTime(data.updatedAt) })}
        actions={
          <>
            <div role="group" aria-label={t('overview.range')} className={segmentedRoot}>
              {overviewRanges.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={range === option}
                  onClick={() => setRange(option)}
                  className={segmentedItem({ active: range === option, className: 'px-4' })}
                >
                  {t(`overview.ranges.${option}`)}
                </button>
              ))}
            </div>
            <ThemeToggle />
          </>
        }
      />

      {overview.isError && <ErrorMessage onRetry={() => void overview.refetch()} />}
      {overview.isPending && <LoadingBlocks count={4} />}
      {data && (
        <div
          className="flex flex-col gap-5 transition-opacity aria-busy:opacity-60"
          aria-busy={overview.isPlaceholderData}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiOrder.map((kpi) => kpiTile(kpi, data))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <OrdersChart daily={data.daily} />
            <SlotsCard slots={data.slots} batch={data.batch} />
          </div>

          <Card className="rounded-26 px-2 pt-2 pb-1">
            <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-2">
              <h2 id="recent-orders" className="text-16 font-bold">
                {t('overview.recent')}
              </h2>
              <Link
                href="/admin/orders"
                className={buttonVariants({ variant: 'link', size: 'sm', className: 'px-0' })}
              >
                {t('overview.allOrders')}
                <ChevronRight aria-hidden className="size-4 rtl:rotate-180" />
              </Link>
            </div>
            <OrdersTable orders={data.recent} labelledBy="recent-orders" />
          </Card>
        </div>
      )}
    </>
  );
}
