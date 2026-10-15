'use client';

import { dayOfMonth, formatCalories, formatMoney, type PlanDay } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { mealName } from '@/lib/meal';

interface DayCardProps {
  day: PlanDay;
  onSwap: () => void;
  swapping: boolean;
  disabled: boolean;
}

/** One workday of the plan: the date, the meal, its price and calories, and a swap button. */
export function DayCard({ day, onSwap, swapping, disabled }: DayCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { suggestion } = day;

  return (
    <Card className="flex items-center gap-3 rounded-22 px-3 py-2.5">
      <div className="flex size-13 shrink-0 flex-col items-center justify-center rounded-16 bg-surface-2">
        <span className="text-11 text-muted">{t(`weekdays.${day.weekday}`)}</span>
        <span className="text-18 leading-tight font-bold">{dayOfMonth(day.date)}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-14 font-semibold">{mealName(suggestion, locale)}</span>
        <span className="text-12 text-muted">
          {t('plan.dayMeta', {
            price: formatMoney(suggestion.bill.food, locale),
            calories: formatCalories(suggestion.kcal, locale, {
              approximate: suggestion.kcalSource === 'ai',
            }),
          })}
        </span>
      </div>
      <Button variant="tonal" size="sm" onClick={onSwap} disabled={disabled}>
        {swapping ? t('plan.swapping') : t('plan.swap')}
      </Button>
    </Card>
  );
}
