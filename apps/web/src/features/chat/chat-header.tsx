'use client';

import { formatMoney, formatNumber, type UserPrefs } from '@lo2ma/core';
import { MapPin } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { focusRing } from '@/components/ui/focus';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-18 bg-surface px-3.5 py-2.5">
      <span className="text-12 text-muted">{label}</span>
      <span className="text-18 font-bold">{value}</span>
    </div>
  );
}

/** Brand, workplace and today's limits. Without preferences it only shows the brand and a setup link. */
export function ChatHeader({ prefs }: { prefs: UserPrefs | null | undefined }) {
  const t = useTranslations();
  const locale = useLocale();
  const calories = prefs?.calories;

  return (
    <header className="flex flex-col gap-3.5 px-gutter pt-gutter pb-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-26 leading-none font-extrabold">{t('common.brand')}</span>
          <span aria-hidden className="size-2 rounded-full bg-primary" />
        </div>
        <Link
          href="/onboarding"
          className={cn(
            'inline-flex h-11 max-w-3/5 items-center gap-1.5 rounded-full bg-surface px-3.5 text-13 font-medium ring-1 ring-line ring-inset',
            focusRing,
          )}
        >
          <MapPin aria-hidden className="size-4 shrink-0 text-primary" />
          <span className="truncate">
            {prefs ? prefs.workplace.name[locale] : t('prefs.workplace')}
          </span>
        </Link>
      </div>
      {prefs && (
        <div className="grid grid-cols-2 gap-2.5">
          <Stat label={t('chat.todayBudget')} value={formatMoney(prefs.budget, locale)} />
          <Stat
            label={t('chat.mealCalories')}
            value={
              calories && calories.mode !== 'any'
                ? t('chat.caloriesOrLess', { kcal: formatNumber(calories.kcal, locale) })
                : t('prefs.caloriesAny')
            }
          />
        </div>
      )}
    </header>
  );
}
