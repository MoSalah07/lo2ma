'use client';

import { dayOfMonth, formatDayMonth, formatNumber } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { chartScale, shareOf } from './chart-scale';

interface OrdersChartProps {
  daily: { date: string; orders: number }[];
}

/**
 * Orders per workday as bars, the latest one labelled. The bars are drawn for the eye and hidden from screen
 * readers; a visually hidden table carries the same numbers for them.
 */
export function OrdersChart({ daily }: OrdersChartProps) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const { top, ticks } = chartScale(Math.max(0, ...daily.map((day) => day.orders)));
  const last = daily.length - 1;

  return (
    <Card className="flex flex-col gap-4 rounded-card p-5">
      <div className="flex flex-col gap-0.5">
        <h2 id="orders-chart" className="text-title-md">
          {t('overview.chartTitle')}
        </h2>
        <span className="text-caption text-muted">{t('overview.chartSub')}</span>
      </div>

      <div aria-hidden className="flex flex-col gap-2">
        <div className="flex h-55 gap-2">
          <div className="flex w-7 shrink-0 -translate-y-1.5 flex-col justify-between text-caption-sm text-muted tabular-nums">
            {ticks.map((tick) => (
              <span key={tick}>{formatNumber(tick, locale)}</span>
            ))}
          </div>
          <div className="relative min-w-0 flex-1">
            {ticks.map((tick) => (
              <div
                key={tick}
                className={cn('absolute inset-x-0 h-px', tick === 0 ? 'bg-line' : 'bg-divider')}
                style={{ bottom: shareOf(tick, top) }}
              />
            ))}
            <div className="absolute inset-0 flex items-end">
              {daily.map((day, index) => (
                <div
                  key={day.date}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1"
                >
                  {index === last && (
                    <span className="text-caption font-bold tabular-nums">
                      {formatNumber(day.orders, locale)}
                    </span>
                  )}
                  <div
                    className="relative w-6 rounded-t-tag bg-primary transition-opacity group-hover:opacity-85"
                    style={{ height: shareOf(day.orders, top) }}
                  >
                    <div className="pointer-events-none absolute inset-x-0 bottom-full mb-2 flex justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="rounded-control bg-inverse px-2.5 py-1.5 text-caption font-semibold whitespace-nowrap text-on-inverse">
                        {t('overview.barTip', {
                          date: formatDayMonth(day.date, locale),
                          orders: t('orderCount', { count: day.orders }),
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 text-caption-sm text-muted">
          <span className="w-7 shrink-0" />
          <div className="flex flex-1">
            {daily.map((day, index) => (
              <span
                key={day.date}
                className={cn('flex-1 text-center', index === last && 'font-bold text-ink')}
              >
                {index === last ? t('overview.today') : dayOfMonth(day.date)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only" aria-labelledby="orders-chart">
        <thead>
          <tr>
            <th scope="col">{t('overview.day')}</th>
            <th scope="col">{t('overview.orders')}</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((day) => (
            <tr key={day.date}>
              <td>{formatDayMonth(day.date, locale)}</td>
              <td>{formatNumber(day.orders, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
