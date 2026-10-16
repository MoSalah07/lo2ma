import {
  dayOfMonth,
  formatTime,
  minutesBetween,
  orderProgress,
  type OrderStatus,
  type PlanDay,
  type WeeklyPlan,
} from '@lo2ma/core';
import { ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Meter } from '@/components/ui/meter';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { mealName } from '@/lib/meal';

interface TodayCardProps {
  day: PlanDay;
  /** The step today's order has reached. */
  status: OrderStatus;
  plan: WeeklyPlan;
}

/** Today's order while it is on its way: the step, a progress bar, the arrival and a link to track it. */
export function TodayCard({ day, status, plan }: TodayCardProps) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-2 rounded-24 bg-primary px-4 py-3.5 text-on-primary">
      <div className="flex items-center justify-between gap-2">
        <span className="text-12 font-medium">
          {t('plan.today', {
            weekday: t(`weekdays.${day.weekday}`),
            day: dayOfMonth(day.date),
          })}
        </span>
        <Badge tone="onPrimary" className="h-6">
          {t(`tracking.steps.${status}`)}
        </Badge>
      </div>
      <span className="text-17 leading-heading font-bold">{mealName(day.suggestion, locale)}</span>
      <Meter value={orderProgress(status)} label={t('tracking.title')} tone="onPrimary" />
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className="text-13 font-medium">
          {t('plan.todayEta', {
            time: formatTime(plan.arrivalTime),
            beforeBreak: t('common.beforeBreak', {
              minutes: minutesBetween(plan.arrivalTime, plan.breakTime),
            }),
          })}
        </span>
        {day.orderId && (
          <Link
            href={`/orders/${day.orderId}`}
            className={cn(buttonVariants({ variant: 'onPrimary', size: 'sm' }), 'shrink-0')}
          >
            {t('plan.track')}
            <ChevronRight aria-hidden className="size-3.5 rtl:rotate-180" />
          </Link>
        )}
      </div>
    </div>
  );
}
