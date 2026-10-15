'use client';

import { formatCalories, formatDateRange, formatMoney, formatTime } from '@lo2ma/core';
import { CircleCheck, UsersRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { BottomAction } from '@/components/bottom-action';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Meter } from '@/components/ui/meter';
import { SignedInButton } from '@/features/auth/signed-in-button';
import { Link } from '@/i18n/navigation';
import { useConfirmPlan, usePlan, useSwapDay } from './api';
import { DayCard } from './day-card';

function PlanHeader({ range }: { range?: string }) {
  const t = useTranslations('plan');
  return (
    <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
      <h1 className="text-26 leading-heading font-extrabold">{t('title')}</h1>
      {range && (
        <span className="inline-flex h-8.5 items-center rounded-full bg-surface px-3 text-13 font-medium ring-1 ring-line ring-inset">
          {range}
        </span>
      )}
    </header>
  );
}

export function PlanScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const plan = usePlan();
  const swap = useSwapDay();
  const confirm = useConfirmPlan();

  if (plan.isPending) {
    return (
      <>
        <PlanHeader />
        <div className="px-4">
          <LoadingBlocks count={5} />
        </div>
      </>
    );
  }
  if (plan.isError) {
    return (
      <>
        <PlanHeader />
        <ErrorMessage onRetry={() => void plan.refetch()} />
      </>
    );
  }
  if (!plan.data) {
    return (
      <>
        <PlanHeader />
        <div className="flex flex-col items-center gap-4 px-5 py-10 text-center">
          <p className="text-15 text-ink-2">{t('plan.needsOnboarding')}</p>
          <Link href="/onboarding" className={buttonVariants({ size: 'md' })}>
            {t('onboarding.start')}
          </Link>
        </div>
      </>
    );
  }

  const week = plan.data;
  const first = week.days[0]?.date;
  const last = week.days.at(-1)?.date;

  return (
    <>
      <PlanHeader range={first && last ? formatDateRange(first, last, locale) : undefined} />
      <div className="flex flex-col gap-3 px-4 pb-64">
        <Card className="flex flex-col gap-2.5 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-12 text-muted">{t('plan.weeklyBudget')}</span>
            <span className="text-16 font-bold">
              {t('plan.spentOf', {
                spent: formatMoney(week.total, locale),
                budget: formatMoney(week.budget, locale),
              })}
            </span>
          </div>
          <Meter value={week.total / week.budget} label={t('plan.weeklyBudget')} />
          <div className="flex flex-wrap gap-1.5">
            {week.mealCalorieLimit && (
              <Badge className="h-6.5 px-2.5 font-medium">
                {t('plan.mealLimit', { calories: formatCalories(week.mealCalorieLimit, locale) })}
              </Badge>
            )}
            <Badge className="h-6.5 px-2.5 font-medium">
              {t('plan.breakRule', {
                time: formatTime(week.breakTime),
                arrival: formatTime(week.arrivalTime),
              })}
            </Badge>
          </div>
        </Card>

        {week.confirmed && (
          <p className="flex items-center gap-2.5 rounded-18 bg-good px-3.5 py-3 text-13 font-medium text-on-good">
            <CircleCheck aria-hidden className="size-4.5 shrink-0" />
            {t('plan.confirmed')}
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {week.days.map((day) => (
            <li key={day.date}>
              <DayCard
                day={day}
                onSwap={() => swap.mutate(day.date)}
                swapping={swap.isPending && swap.variables === day.date}
                disabled={swap.isPending || week.confirmed}
              />
            </li>
          ))}
        </ul>

        <p className="flex items-center gap-2 px-1 text-12 text-muted">
          <UsersRound aria-hidden className="size-4 shrink-0" />
          {t('plan.sharedDelivery', { amount: formatMoney(week.sharedDeliveryFee, locale) })}
        </p>
        {swap.isError && <ErrorMessage />}
        {confirm.isError && <ErrorMessage />}
      </div>

      {!week.confirmed && (
        <BottomAction aboveNav>
          <SignedInButton
            block
            next="/plan"
            onSignedIn={() => confirm.mutate()}
            disabled={confirm.isPending || swap.isPending}
          >
            {t('plan.confirm', { amount: formatMoney(week.total, locale) })}
          </SignedInButton>
          <p className="text-center text-11 text-muted">
            {t('plan.cutoff', { time: formatTime(week.changeCutoff) })}
          </p>
        </BottomAction>
      )}
    </>
  );
}
