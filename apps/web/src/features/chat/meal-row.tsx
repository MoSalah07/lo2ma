'use client';

import {
  formatCalories,
  formatGrams,
  formatMoney,
  type FitTarget,
  type Suggestion,
} from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { focusRing } from '@/components/ui/focus';
import { FitBadge } from '@/features/fit/fit-match';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { mealName } from '@/lib/meal';

/** A runner-up suggestion: one tappable line that opens its details. In «وضع الفورمة» it says how it fits. */
export function MealRow({ suggestion, goal }: { suggestion: Suggestion; goal?: FitTarget }) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Link
      href={`/meals/${suggestion.id}`}
      className={cn(
        'flex items-center justify-between gap-3 rounded-card bg-surface px-4 py-3 shadow-card',
        focusRing,
      )}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-label-lg">
          <bdi>{mealName(suggestion, locale)}</bdi>
        </span>
        <span className="text-caption text-muted">
          {t('chat.mealMeta', {
            restaurant: suggestion.restaurant.name[locale],
            duration: t('common.minutes', { count: suggestion.restaurant.etaMinutes }),
          })}
        </span>
        {goal && (
          <span className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <FitBadge meal={suggestion} goal={goal} />
            <span className="text-caption text-ink-2">
              {t('fit.mealLine', {
                calories: formatCalories(suggestion.kcal, locale, {
                  approximate: suggestion.kcalSource === 'ai',
                }),
                protein: formatGrams(suggestion.macros.protein, locale),
              })}
            </span>
          </span>
        )}
      </span>
      <span className="shrink-0 text-title-md font-extrabold">
        {formatMoney(suggestion.bill.total, locale)}
      </span>
    </Link>
  );
}
