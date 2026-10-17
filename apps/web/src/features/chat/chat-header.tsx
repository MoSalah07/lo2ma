'use client';

import { formatMoney, formatNumber, type UserPrefs } from '@lo2ma/core';
import { MapPin } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { focusRing } from '@/components/ui/focus';
import { WithLocationPicker } from '@/features/location/with-location-picker';
import { useSavePrefs } from '@/features/prefs/api';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

const chip = cn(
  'inline-flex h-11 max-w-3/5 items-center gap-1.5 rounded-full bg-surface px-3.5 text-13 font-medium ring-1 ring-line ring-inset',
  focusRing,
);

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-18 bg-surface px-3.5 py-2.5">
      <span className="text-12 text-muted">{label}</span>
      <span className="text-18 font-bold">{value}</span>
    </div>
  );
}

/**
 * Brand, workplace and today's limits. The workplace opens the map, like the address at the top of a delivery
 * app. Without preferences it only shows the brand and a link to set them up.
 */
export function ChatHeader({ prefs }: { prefs: UserPrefs | null | undefined }) {
  const t = useTranslations();
  const locale = useLocale();
  const save = useSavePrefs();
  const calories = prefs?.calories;

  return (
    <header className="flex flex-col gap-3.5 px-gutter pt-gutter pb-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-26 leading-none font-extrabold">{t('common.brand')}</span>
          <span aria-hidden className="size-2 rounded-full bg-primary" />
        </div>
        {prefs ? (
          <WithLocationPicker
            value={prefs.workplace}
            onConfirm={(workplace) => save.mutate({ ...prefs, workplace })}
          >
            {(trigger) => (
              <button type="button" {...trigger} className={chip}>
                <MapPin aria-hidden className="size-4 shrink-0 text-primary" />
                {/* Heard as «مكان الشغل، القرية الذكية…»: the name says what tapping it changes. */}
                <span className="sr-only">{t('prefs.workplace')}</span>
                <bdi className="truncate">{prefs.workplace.name[locale]}</bdi>
              </button>
            )}
          </WithLocationPicker>
        ) : (
          <Link href="/onboarding" className={chip}>
            <MapPin aria-hidden className="size-4 shrink-0 text-primary" />
            <span className="truncate">{t('prefs.workplace')}</span>
          </Link>
        )}
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
