import { formatMoney, formatTime, type PlanDay, type WeeklyPlan } from '@lo2ma/core';
import { Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Screen } from '@/components/screen';
import { ErrorMessage } from '@/components/status-message';
import { Badge } from '@/components/ui/badge';
import { Sequence, SequenceItem } from '@/components/motion/entrance';
import { usePlanErrorText, useSwapDay } from './api';
import { DayCard } from './day-card';
import { PlanDayRow } from './plan-day-row';
import { TodayCard } from './today-card';
import { WeekSummary } from './week-summary';

/** Only today's order can be between sent and delivered. */
const isOnItsWay = (day: PlanDay) =>
  day.status !== undefined && day.status !== 'scheduled' && day.status !== 'delivered';

/** A confirmed plan as the week goes by: days that arrived, today's order, and the days still to come. */
export function CurrentPlan({ plan }: { plan: WeeklyPlan }) {
  const t = useTranslations();
  const locale = useLocale();
  const swap = useSwapDay();
  const errorText = usePlanErrorText();

  function renderDay(day: PlanDay) {
    const status = day.status ?? 'scheduled';
    const price = formatMoney(day.suggestion.bill.food, locale);

    if (status === 'scheduled') {
      return (
        <DayCard
          day={day}
          size="md"
          meta={t('plan.ordersAt', { time: formatTime(plan.sendTime), price })}
          onSwap={() => swap.mutate(day.date)}
          swapping={swap.isPending && swap.variables === day.date}
          disabled={swap.isPending || !day.canChange}
        />
      );
    }
    if (status === 'delivered') {
      return (
        <PlanDayRow day={day} meta={price} done>
          <Badge tone="good" size="md" className="font-medium">
            <Check aria-hidden className="size-3" strokeWidth={3} />
            {t('plan.deliveredAt', { time: formatTime(day.deliveredAt ?? plan.arrivalTime) })}
          </Badge>
        </PlanDayRow>
      );
    }
    return <TodayCard day={day} status={status} plan={plan} />;
  }

  return (
    <Screen clear="nav">
      <WeekSummary plan={plan} />
      <Sequence as="ol" className="flex flex-col gap-list">
        {plan.days.map((day) => (
          <li key={day.date} aria-current={isOnItsWay(day) ? 'date' : undefined}>
            <SequenceItem>{renderDay(day)}</SequenceItem>
          </li>
        ))}
      </Sequence>
      <p className="px-1 text-12 text-muted">
        {t('plan.cutoff', { time: formatTime(plan.changeCutoff) })}
      </p>
      {swap.isError && <ErrorMessage message={errorText(swap.error)} />}
    </Screen>
  );
}
