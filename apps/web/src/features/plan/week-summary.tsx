import {
  formatMoney,
  formatNumber,
  formatTime,
  planDayProgress,
  type WeeklyPlan,
} from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

/** The top of a confirmed plan: what was paid, how many days arrived, one bar per day and the rules. */
export function WeekSummary({ plan }: { plan: WeeklyPlan }) {
  const t = useTranslations();
  const locale = useLocale();
  const delivered = plan.days.filter((day) => day.status === 'delivered').length;

  return (
    <Card className="flex flex-col gap-2.5 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-caption text-muted">
          {t('tracking.paid', { amount: formatMoney(plan.paidTotal ?? plan.total, locale) })}
        </span>
        <span className="text-label-md">
          {t('plan.deliveredCount', {
            count: delivered,
            total: formatNumber(plan.days.length, locale),
          })}
        </span>
      </div>
      {/* The count above says the same in words. */}
      <div aria-hidden className="flex gap-1">
        {plan.days.map((day) => (
          <div key={day.date} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${planDayProgress(day.status) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge className="h-6.5 px-2.5 font-medium">
          {t('plan.breakRule', {
            time: formatTime(plan.breakTime),
            arrival: formatTime(plan.arrivalTime),
          })}
        </Badge>
        <Badge className="h-6.5 px-2.5 font-medium">
          {t('plan.deliveryShort', { amount: formatMoney(plan.sharedDeliveryFee, locale) })}
        </Badge>
      </div>
    </Card>
  );
}
