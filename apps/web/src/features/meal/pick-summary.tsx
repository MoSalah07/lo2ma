'use client';

import { formatMoney, type Suggestion } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { MealIcon } from '@/components/meal-icon';
import { mealName } from '@/lib/meal';

/** «اختيارك: كشري كبير + رز بلبن · 150 ج», shown in the sign-in sheet so guests see their pick is kept. */
export function PickSummary({ suggestion }: { suggestion: Suggestion }) {
  const t = useTranslations('auth.gate');
  const locale = useLocale();
  return (
    <div className="flex items-center gap-3 rounded-card bg-surface-2 p-3">
      <MealIcon size="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-caption text-muted">{t('yourPick')}</span>
        <span className="truncate text-label-lg">
          <bdi>{mealName(suggestion, locale)}</bdi>
        </span>
      </div>
      <span className="text-title-md font-extrabold">
        {formatMoney(suggestion.bill.total, locale)}
      </span>
    </div>
  );
}
