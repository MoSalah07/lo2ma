'use client';

import { formatMoney, type Suggestion } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { focusRing } from '@/components/ui/focus';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { mealName } from '@/lib/meal';

/** A runner-up suggestion: one tappable line that opens its details. */
export function MealRow({ suggestion }: { suggestion: Suggestion }) {
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
      </span>
      <span className="shrink-0 text-title-md font-extrabold">
        {formatMoney(suggestion.bill.total, locale)}
      </span>
    </Link>
  );
}
