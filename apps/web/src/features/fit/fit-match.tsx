'use client';

import {
  formatCalories,
  formatGrams,
  formatNumber,
  mealFit,
  type CalorieSource,
  type FitTarget,
  type MealFit,
  type MealNumbers,
} from '@lo2ma/core';
import { Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { BudgetLine } from '@/components/budget-line';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

const tones: Record<MealFit, BadgeProps['tone']> = {
  inGoal: 'good',
  lowProtein: 'warn',
  under: 'neutral',
  over: 'warn',
};

/** «في هدفك», «بروتين أقل»…: a meal's verdict against the fit goal. */
export function FitBadge({ meal, goal }: { meal: MealNumbers; goal: FitTarget }) {
  const t = useTranslations('fit');
  const status = mealFit(goal, meal);
  return (
    <Badge tone={tones[status]}>
      {status === 'inGoal' && <Check aria-hidden className="size-3" strokeWidth={2.6} />}
      {t(`status.${status}`)}
    </Badge>
  );
}

/** One line for a meal in a list or a summary: the verdict, then its calories and protein. */
export function FitLine({
  meal,
  goal,
}: {
  meal: MealNumbers & { kcalSource: CalorieSource };
  goal: FitTarget;
}) {
  const t = useTranslations('fit');
  const locale = useLocale();
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <FitBadge meal={meal} goal={goal} />
      <span className="text-caption text-ink-2">
        {t('mealLine', {
          calories: formatCalories(meal.kcal, locale, { approximate: meal.kcalSource === 'ai' }),
          protein: formatGrams(meal.macros.protein, locale),
        })}
      </span>
    </span>
  );
}

interface FitMatchProps {
  meal: MealNumbers & { kcalSource: CalorieSource };
  goal: FitTarget;
  /** The meal screen shows protein, carbs and fat as tiles; a card shows carbs and fat in a line. */
  detailed?: boolean;
  className?: string;
}

/** How a meal stands against the fit goal: the verdict, its calories and protein against the goal, and the rest. */
export function FitMatch({ meal, goal, detailed = false, className }: FitMatchProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { protein, carbs, fat } = meal.macros;
  const grams = (value: number) => formatGrams(value, locale);

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <FitBadge meal={meal} goal={goal} />
        {meal.kcalSource === 'ai' && <Badge tone="accent">{t('common.aiEstimate')}</Badge>}
      </div>
      <BudgetLine
        label={t('fit.calories')}
        remaining={t('fit.ofGoal', {
          value: formatNumber(meal.kcal, locale),
          goal: formatCalories(goal.kcal, locale),
        })}
        ratio={meal.kcal / goal.kcal}
      />
      <BudgetLine
        label={t('fit.protein')}
        remaining={t('fit.ofGoal', {
          value: formatNumber(protein, locale),
          goal: grams(goal.protein),
        })}
        ratio={protein / goal.protein}
      />
      {detailed ? (
        <dl className="grid grid-cols-3 gap-2">
          {[
            { label: t('fit.protein'), value: grams(protein) },
            { label: t('fit.carbs'), value: grams(carbs) },
            { label: t('fit.fat'), value: grams(fat) },
          ].map((tile) => (
            <div
              key={tile.label}
              className="flex flex-col-reverse gap-0.5 rounded-control bg-surface-2 px-3 py-2.5"
            >
              <dt className="text-caption text-muted">{tile.label}</dt>
              <dd className="text-title-md">{tile.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-caption text-muted">
          {t('fit.macrosLine', { carbs: grams(carbs), fat: grams(fat) })}
        </p>
      )}
    </div>
  );
}
