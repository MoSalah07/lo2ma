'use client';

import {
  budgetUsage,
  formatCalories,
  formatMoney,
  formatNumber,
  type Suggestion,
} from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { BudgetLine } from '@/components/budget-line';
import { CalorieLine } from '@/components/calorie-line';
import { MealIcon } from '@/components/meal-icon';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SignedInButton } from '@/features/auth/signed-in-button';
import { PickSummary } from '@/features/meal/pick-summary';
import { Link, useRouter } from '@/i18n/navigation';
import { mealName, pounds } from '@/lib/meal';

interface MealCardProps {
  suggestion: Suggestion;
  budget?: number;
}

/** The main suggestion in the chat: what, where, the bill, how much budget is left and the calories. */
export function MealCard({ suggestion, budget }: MealCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { bill, restaurant } = suggestion;
  const usage = budget ? budgetUsage(budget, bill.total) : null;
  const checkout = `/checkout/${suggestion.id}`;

  return (
    <Card className="flex flex-col gap-3.5 rounded-26 p-4">
      <div className="flex items-center gap-3">
        <MealIcon />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="text-15 font-bold">
            <bdi>{mealName(suggestion, locale)}</bdi>
          </h3>
          <span className="text-12 text-muted">
            {t('chat.mealMeta', {
              restaurant: restaurant.name[locale],
              duration: t('common.minutes', { count: restaurant.etaMinutes }),
            })}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-20 leading-none font-extrabold">
            {formatMoney(bill.total, locale)}
          </span>
          {suggestion.bestValue && <Badge tone="highlight">{t('common.bestValue')}</Badge>}
        </div>
      </div>

      <p className="text-12 text-muted">
        {t('bill.breakdown', {
          food: formatNumber(pounds(bill.food), locale),
          delivery: formatNumber(pounds(bill.delivery), locale),
          service: formatNumber(pounds(bill.service), locale),
        })}
      </p>

      {usage && budget && (
        <BudgetLine
          label={t('chat.ofYourBudget')}
          remaining={t('bill.remaining', {
            amount: formatMoney(Math.max(usage.remaining, 0), locale),
          })}
          ratio={usage.ratio}
        />
      )}

      <CalorieLine
        className="text-12 text-ink-2"
        text={formatCalories(suggestion.kcal, locale, {
          approximate: suggestion.kcalSource === 'ai',
        })}
        estimateLabel={suggestion.kcalSource === 'ai' ? t('common.aiEstimate') : undefined}
      />

      <div className="flex gap-2">
        <SignedInButton
          size="md"
          className="flex-1"
          next={checkout}
          onSignedIn={() => router.push(checkout)}
          summary={<PickSummary suggestion={suggestion} />}
        >
          {t('chat.pick')}
        </SignedInButton>
        <Link
          href={`/meals/${suggestion.id}`}
          className={buttonVariants({ variant: 'tonal', size: 'md', className: 'px-4.5 text-14' })}
        >
          {t('common.details')}
        </Link>
      </div>
    </Card>
  );
}
