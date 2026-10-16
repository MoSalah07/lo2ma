'use client';

import { formatCalories, formatMoney, type PlanDay } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { PlanDayRow } from './plan-day-row';

interface DayCardProps {
  day: PlanDay;
  onSwap: () => void;
  swapping: boolean;
  disabled: boolean;
  /** Replaces the default price and calories line. */
  meta?: string;
  size?: 'md' | 'lg';
}

/** A workday the user can still change: the date, the meal, a line about it and a swap button. */
export function DayCard({ day, onSwap, swapping, disabled, meta, size = 'lg' }: DayCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { suggestion } = day;

  return (
    <PlanDayRow
      day={day}
      size={size}
      meta={
        meta ??
        t('plan.dayMeta', {
          price: formatMoney(suggestion.bill.food, locale),
          calories: formatCalories(suggestion.kcal, locale, {
            approximate: suggestion.kcalSource === 'ai',
          }),
        })
      }
    >
      <Button variant="tonal" size="sm" onClick={onSwap} disabled={disabled}>
        {swapping ? t('plan.swapping') : t('plan.swap')}
      </Button>
    </PlanDayRow>
  );
}
