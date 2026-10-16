import { dayOfMonth, type PlanDay } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';
import { PlanRow } from '@/components/plan-row';
import { mealName } from '@/lib/meal';

type PlanDayRowProps = Omit<ComponentProps<typeof PlanRow>, 'weekday' | 'day' | 'meal'> & {
  day: PlanDay;
};

/** A day of the plan from the API, as a row: its weekday, date and meal in the page's language. */
export function PlanDayRow({ day, ...props }: PlanDayRowProps) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <PlanRow
      weekday={t(`weekdays.${day.weekday}`)}
      day={dayOfMonth(day.date)}
      meal={mealName(day.suggestion, locale)}
      {...props}
    />
  );
}
