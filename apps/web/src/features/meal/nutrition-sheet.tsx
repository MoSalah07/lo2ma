'use client';

import {
  formatCalorieRange,
  formatCalories,
  formatGrams,
  formatNumber,
  type DishBreakdown,
  type Suggestion,
} from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { useMealBreakdown, useReportNutrition } from './api';

interface NutritionSheetProps {
  meal: Suggestion;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** «حسبناها ازاي»: the foods behind an estimate, with a way to say the dish came different. */
export function NutritionSheet({ meal, open, onOpenChange }: NutritionSheetProps) {
  const t = useTranslations();
  const locale = useLocale();
  const breakdown = useMealBreakdown(meal.id, open);
  const report = useReportNutrition(meal.id);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('meal.how')}
      description={
        meal.kcalRange
          ? t('meal.howIntro', { range: formatCalorieRange(meal.kcalRange, locale) })
          : undefined
      }
      closeLabel={t('common.close')}
    >
      {breakdown.isPending ? (
        <LoadingBlocks count={2} />
      ) : breakdown.isError ? (
        <ErrorMessage onRetry={() => void breakdown.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          {breakdown.data.dishes.map((dish) => (
            <DishRows key={dish.id} dish={dish} />
          ))}

          <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2.5 text-body-md font-bold">
            <span>{t('meal.total')}</span>
            <span>
              {formatCalories(meal.kcal, locale, { approximate: meal.kcalSource === 'ai' })}
              {' · '}
              {formatGrams(meal.macros.protein, locale)}
            </span>
          </div>

          <p className="text-caption text-muted">{t('meal.sources')}</p>
          {report.isSuccess ? (
            <p role="status" className="text-body-sm text-ink-2">
              {t('meal.reported')}
            </p>
          ) : (
            <Button
              variant="link"
              size="sm"
              className="self-start px-0"
              disabled={report.isPending}
              onClick={() => report.mutate()}
            >
              {t('meal.report')}
            </Button>
          )}
        </div>
      )}
    </Sheet>
  );
}

/** One dish: its foods when we estimated it, a single line when the restaurant published it. */
function DishRows({ dish }: { dish: DishBreakdown }) {
  const t = useTranslations('meal');
  const locale = useLocale();

  if (dish.kcalSource === 'restaurant') {
    return (
      <p className="flex items-baseline justify-between gap-3 text-body-sm">
        <span>
          <bdi className="font-medium">{dish.name[locale]}</bdi>
          <span className="text-muted"> · {t('published')}</span>
        </span>
        <span className="font-semibold">{formatCalories(dish.kcal, locale)}</span>
      </p>
    );
  }

  return (
    <table className="w-full text-body-sm">
      <caption className="pb-2 text-start text-label-md text-ink-2">
        <bdi>{dish.name[locale]}</bdi>
      </caption>
      <thead>
        <tr className="text-caption text-muted">
          <th scope="col" className="pb-1.5 text-start font-semibold">
            {t('colFood')}
          </th>
          <th scope="col" className="pb-1.5 text-end font-semibold">
            {t('colAmount')}
          </th>
          <th scope="col" className="pb-1.5 text-end font-semibold">
            {t('colKcal')}
          </th>
          <th scope="col" className="pb-1.5 text-end font-semibold">
            {t('colProtein')}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-divider border-t border-divider">
        {dish.lines.map((line) => (
          <tr key={line.name.en}>
            <th scope="row" className="py-2.5 text-start font-medium">
              <bdi>{line.name[locale]}</bdi>
            </th>
            <td className="py-2.5 text-end text-ink-2">{formatGrams(line.grams, locale)}</td>
            <td className="py-2.5 text-end">{formatNumber(line.kcal, locale)}</td>
            <td className="py-2.5 text-end">{formatGrams(line.protein, locale)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
