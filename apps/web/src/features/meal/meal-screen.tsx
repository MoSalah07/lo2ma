'use client';

import { formatMoney, formatNumber } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { BottomAction } from '@/components/bottom-action';
import { MealIcon } from '@/components/meal-icon';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { Badge } from '@/components/ui/badge';
import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { SignedInButton } from '@/features/auth/signed-in-button';
import { usePrefs } from '@/features/prefs/api';
import { fitTargetOf } from '@/features/prefs/options';
import { useRouter } from '@/i18n/navigation';
import { avoidedIn, isVegetarianMeal, mealName } from '@/lib/meal';
import { useSuggestion } from './api';
import { BillCard } from './bill-card';
import { MealNutrition } from './meal-nutrition';
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

  return (
    <>
      <Screen clear="action">
        <MealIcon size="hero" />
        <div className="flex flex-col gap-1.5">
          <h2 className="text-title-lg">
            <bdi>{mealName(meal, locale)}</bdi>
          </h2>
          <p className="text-body-sm text-muted">
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

        <MealNutrition meal={meal} goal={fitTargetOf(prefs.data?.calories)} />

        <section className="flex flex-col gap-2">
          <h2 className="text-label-md text-ink-2">{t('meal.items')}</h2>
          <Card className="rounded-card px-4">
            <ul className="divide-y divide-divider">
              {meal.items.map((item) => (
                <li
                  key={item.id}
                  className="flex h-12 items-center justify-between gap-3 text-body-md"
                >
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
      </Screen>

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
