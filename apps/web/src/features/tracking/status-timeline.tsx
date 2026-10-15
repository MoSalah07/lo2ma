'use client';

import { formatTime, orderSteps, type Order } from '@lo2ma/core';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';

/** The five steps from «اتبعت للمطعم» to «وصل»: done, current and still to come. */
export function StatusTimeline({ order }: { order: Order }) {
  const t = useTranslations('tracking');
  const current = orderSteps.indexOf(order.status);

  return (
    <Card className="px-4.5 py-4">
      <ol className="flex flex-col">
        {order.timeline.map((step, index) => {
          const done = index < current || order.status === 'delivered';
          const active = index === current && order.status !== 'delivered';
          const last = index === order.timeline.length - 1;
          return (
            <li key={step.status} aria-current={active ? 'step' : undefined} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full',
                    done && 'bg-primary text-on-primary',
                    active && 'bg-tint',
                    !done && !active && 'ring-2 ring-line ring-inset',
                  )}
                >
                  {done && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
                  {active && <span aria-hidden className="size-2.5 rounded-full bg-primary" />}
                </span>
                {!last && (
                  <span aria-hidden className={cn('h-4 w-0.5', done ? 'bg-primary' : 'bg-line')} />
                )}
              </div>
              <div className="flex flex-1 items-start justify-between gap-2 pt-1">
                <span
                  className={cn(
                    'text-14',
                    active ? 'font-bold' : done ? 'font-semibold' : 'font-medium text-muted',
                  )}
                >
                  {t(`steps.${step.status}`)}
                </span>
                <span className="text-12 text-muted">
                  {done ? formatTime(step.at) : t('around', { time: formatTime(step.at) })}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
