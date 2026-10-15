'use client';

import { formatCalories, formatMoney, formatNumber } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { BottomAction } from '@/components/bottom-action';
import { CalorieLine } from '@/components/calorie-line';
import { MealIcon } from '@/components/meal-icon';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SignedInButton } from '@/features/auth/signed-in-button';
import { usePrefs } from '@/features/prefs/api';
import { useRouter } from '@/i18n/navigation';
import { avoidedIn, isVegetarianMeal, mealName } from '@/lib/meal';
import { useSuggestion } from './api';
import { BillCard } from './bill-card';
import { PickSummary } from './pick-summary';

export function MealScreen({ id }: { id: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const suggestion = useSuggestion(id);
  const prefs = usePrefs();

  if (suggestion.isPending) return <LoadingBlocks count={4} />;
  if (suggestion.isError) return <ErrorMessage onRetry={() => void suggestion.refetch()} />;
  if (!suggestion.data) return <ErrorMessage message={t('meal.notFound')} />;

  const meal = suggestion.data;
  const checkout = `/checkout/${meal.id}`;
  const estimated = meal.kcalSource === 'ai';

  return (
    <>
      <div className="flex flex-col gap-4 px-5 pb-32">
        <MealIcon size="hero" />
        <div className="flex flex-col gap-1.5">
          <h2 className="text-22 leading-heading font-extrabold">{mealName(meal, locale)}</h2>
          <p className="text-13 text-muted">
            {t('meal.meta', {
              restaurant: meal.restaurant.name[locale],
              duration: t('common.minutes', { count: meal.restaurant.etaMinutes }),
              distance: t('format.distanceKm', {
                km: formatNumber(meal.restaurant.distanceKm, locale, 1),
              }),
            })}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {isVegetarianMeal(meal) && (
            <Badge size="md" className="bg-surface ring-1 ring-line ring-inset">
              {t('meal.vegetarian')}
            </Badge>
          )}
          {avoidedIn(meal, prefs.data?.exclusions ?? []).map((ingredient) => (
            <Badge key={ingredient} size="md" tone="good">
              {t('meal.without', { item: t(`prefs.exclusions.${ingredient}`) })}
            </Badge>
          ))}
        </div>

        <Card className="flex flex-col gap-1 rounded-20 px-4 py-3">
          <CalorieLine
            className="text-15 font-bold"
            text={formatCalories(meal.kcal, locale, { approximate: estimated })}
            estimateLabel={estimated ? t('common.aiEstimate') : undefined}
          />
          {estimated && <p className="text-12 text-muted">{t('meal.calorieNote')}</p>}
        </Card>

        <section className="flex flex-col gap-2">
          <h2 className="text-13 font-semibold text-ink-2">{t('meal.items')}</h2>
          <Card className="rounded-22 px-4">
            <ul className="divide-y divide-divider">
              {meal.items.map((item) => (
                <li key={item.id} className="flex h-12 items-center justify-between gap-3 text-14">
                  <span className="font-medium">
                    {item.name[locale]}{' '}
                    <bdi dir="ltr" className="text-muted">
                      {t('format.quantity', { count: item.quantity })}
                    </bdi>
                  </span>
                  <span className="font-semibold">
                    {formatMoney(item.price * item.quantity, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <BillCard bill={meal.bill} budget={prefs.data?.budget} />
      </div>

      <BottomAction>
        <SignedInButton
          block
          next={checkout}
          onSignedIn={() => router.push(checkout)}
          summary={<PickSummary suggestion={meal} />}
        >
          {t('meal.continue', { amount: formatMoney(meal.bill.total, locale) })}
        </SignedInButton>
      </BottomAction>
    </>
  );
}
