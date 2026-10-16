import { formatCalories, formatMoney, formatTime, type WeeklyPlan } from '@lo2ma/core';
import { UsersRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { BottomAction } from '@/components/bottom-action';
import { BudgetLine } from '@/components/budget-line';
import { Screen } from '@/components/screen';
import { preloadSuccessScene } from '@/components/success-moment';
import { ErrorMessage } from '@/components/status-message';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SignedInButton } from '@/features/auth/signed-in-button';
import { useConfirmPlan, usePlanErrorText, useSwapDay } from './api';
import { DayCard } from './day-card';

/**
 * Next week's plan before it is paid: the budget, a swappable meal per day and «أكّد الخطة وادفع». Once it is
 * paid the plan screen celebrates and shows the current plan instead.
 */
export function PlanBuilder({ plan }: { plan: WeeklyPlan }) {
  const t = useTranslations();
  const locale = useLocale();
  const swap = useSwapDay();
  const confirm = useConfirmPlan();
  const errorText = usePlanErrorText();

  // The celebration's 3D loads while the user looks over the week, so confirming never waits for it.
  useEffect(() => preloadSuccessScene(), []);

  return (
    <>
      <Screen clear="navAction">
        <Card className="flex flex-col gap-2.5 p-4">
          <BudgetLine
            size="lg"
            label={t('plan.weeklyBudget')}
            remaining={t('plan.spentOf', {
              spent: formatMoney(plan.total, locale),
              budget: formatMoney(plan.budget, locale),
            })}
            ratio={plan.total / plan.budget}
          />
          <div className="flex flex-wrap gap-1.5">
            {plan.mealCalorieLimit && (
              <Badge className="h-6.5 px-2.5 font-medium">
                {t('plan.mealLimit', { calories: formatCalories(plan.mealCalorieLimit, locale) })}
              </Badge>
            )}
            <Badge className="h-6.5 px-2.5 font-medium">
              {t('plan.breakRule', {
                time: formatTime(plan.breakTime),
                arrival: formatTime(plan.arrivalTime),
              })}
            </Badge>
          </div>
        </Card>

        <ul className="flex flex-col gap-list">
          {plan.days.map((day) => (
            <li key={day.date}>
              <DayCard
                day={day}
                onSwap={() => swap.mutate(day.date)}
                swapping={swap.isPending && swap.variables === day.date}
                disabled={swap.isPending || !day.canChange}
              />
            </li>
          ))}
        </ul>

        <p className="flex items-center gap-2 px-1 text-12 text-muted">
          <UsersRound aria-hidden className="size-4 shrink-0" />
          {t('plan.sharedDelivery', { amount: formatMoney(plan.sharedDeliveryFee, locale) })}
        </p>
        {swap.isError && <ErrorMessage message={errorText(swap.error)} />}
        {confirm.isError && <ErrorMessage message={errorText(confirm.error)} />}
      </Screen>

      <BottomAction aboveNav>
        <SignedInButton
          block
          next="/plan"
          onSignedIn={() => confirm.mutate()}
          disabled={confirm.isPending || swap.isPending}
        >
          {t('plan.confirm', { amount: formatMoney(plan.total, locale) })}
        </SignedInButton>
        <p className="text-center text-11 text-muted">
          {t('plan.cutoff', { time: formatTime(plan.changeCutoff) })}
        </p>
      </BottomAction>
    </>
  );
}
