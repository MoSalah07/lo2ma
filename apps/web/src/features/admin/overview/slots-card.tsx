'use client';

import { formatTime } from '@lo2ma/core';
import { Truck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { shareOf } from './chart-scale';

interface SlotsCardProps {
  slots: { breakTime: string; orders: number }[];
  batch: { orders: number; trips: number };
}

/** Orders per break time, so deliveries to one company can leave together. Each row also says its number. */
export function SlotsCard({ slots, batch }: SlotsCardProps) {
  const t = useTranslations('admin');
  const busiest = Math.max(0, ...slots.map((slot) => slot.orders));

  return (
    <Card className="flex flex-col gap-4.5 rounded-card p-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-title-md">{t('overview.slotsTitle')}</h2>
        <span className="text-caption text-muted">{t('overview.slotsSub')}</span>
      </div>
      <ul className="flex flex-col gap-3.5">
        {slots.map((slot) => (
          <li key={slot.breakTime} className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-label-md tabular-nums">
              {formatTime(slot.breakTime)}
            </span>
            <div aria-hidden className="h-5 min-w-0 flex-1">
              <div
                className="h-5 rounded-e-tag bg-primary"
                style={{ width: shareOf(slot.orders, busiest) }}
              />
            </div>
            <span className="w-24 shrink-0 text-body-sm text-ink-2">
              {t('orderCount', { count: slot.orders })}
            </span>
          </li>
        ))}
      </ul>
      <p className="flex items-center gap-2.5 rounded-card bg-surface-2 px-3.5 py-3 text-body-sm leading-normal text-ink-2">
        <Truck aria-hidden className="size-4.5 shrink-0" />
        {t('overview.batch', {
          orders: t('orderCount', { count: batch.orders }),
          trips: t('overview.trips', { count: batch.trips }),
        })}
      </p>
    </Card>
  );
}
