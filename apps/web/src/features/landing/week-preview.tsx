import { arrivalTimeFor, dayOfMonth, formatMoney, formatTime } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { BudgetLine } from '@/components/budget-line';
import { PlanRow } from '@/components/plan-row';
import { Card } from '@/components/ui/card';
import { sampleWeek } from './sample';

/** A still copy of the weekly plan: the budget bar and the five days. */
export function WeekPreview() {
  const t = useTranslations();
  const locale = useLocale();
  const arrival = formatTime(arrivalTimeFor(sampleWeek.breakTime));

  return (
    <div className="flex flex-col gap-2 rounded-card bg-bg p-3.5">
      <Card className="rounded-card px-4 py-3.5">
        <BudgetLine
          size="lg"
          label={t('plan.weeklyBudget')}
          remaining={t('plan.spentOf', {
            spent: formatMoney(sampleWeek.total, locale),
            budget: formatMoney(sampleWeek.budget, locale),
          })}
          ratio={sampleWeek.total / sampleWeek.budget}
        />
      </Card>
      <ul className="flex flex-col gap-2">
        {sampleWeek.days.map((day) => (
          <li key={day.date}>
            <PlanRow
              weekday={t(`weekdays.${day.weekday}`)}
              day={dayOfMonth(day.date)}
              meal={t(`landing.week.meals.${day.weekday}`)}
              meta={t('landing.week.dayMeta', {
                price: formatMoney(day.food, locale),
                time: arrival,
              })}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
