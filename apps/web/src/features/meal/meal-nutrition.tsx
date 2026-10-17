'use client';

import {
  formatCalorieRange,
  formatCalories,
  formatGrams,
  type FitTarget,
  type Suggestion,
} from '@lo2ma/core';
import { Info } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { CalorieLine } from '@/components/calorie-line';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FitMatch } from '@/features/fit/fit-match';
import { NutritionSheet } from './nutrition-sheet';

interface MealNutritionProps {
  meal: Suggestion;
  /** In «وضع الفورمة», the card measures the meal against the goal. */
  goal?: FitTarget;
}

/** A meal's calories and macros, where they come from, and «حسبناها ازاي» for an estimate. */
export function MealNutrition({ meal, goal }: MealNutritionProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [howOpen, setHowOpen] = useState(false);
  const estimated = meal.kcalSource === 'ai';
  const range = meal.kcalRange && formatCalorieRange(meal.kcalRange, locale);
  const grams = (value: number) => formatGrams(value, locale);

  return (
    <>
      {goal ? (
        <Card className="flex flex-col gap-3.5 p-4">
          <h2 className="text-title-sm">{t('fit.closeness')}</h2>
          <FitMatch meal={meal} goal={goal} detailed />
          {range && <p className="text-caption text-muted">{t('meal.calorieNote', { range })}</p>}
          {estimated && (
            <Button
              variant="tonal"
              size="md"
              block
              aria-haspopup="dialog"
              onClick={() => setHowOpen(true)}
            >
              <Info aria-hidden className="size-4.5" />
              {t('meal.how')}
            </Button>
          )}
        </Card>
      ) : (
        <Card className="flex flex-col gap-1 px-4 py-3">
          <CalorieLine
            className="text-body-md font-bold"
            text={formatCalories(meal.kcal, locale, { approximate: estimated })}
            estimateLabel={estimated ? t('common.aiEstimate') : undefined}
          />
          <p className="text-caption text-ink-2">
            {t('meal.macros', {
              protein: grams(meal.macros.protein),
              carbs: grams(meal.macros.carbs),
              fat: grams(meal.macros.fat),
            })}
          </p>
          {range && <p className="text-caption text-muted">{t('meal.calorieNote', { range })}</p>}
          {estimated && (
            <Button
              variant="link"
              size="sm"
              className="self-start px-0"
              aria-haspopup="dialog"
              onClick={() => setHowOpen(true)}
            >
              {t('meal.how')}
            </Button>
          )}
        </Card>
      )}
      {estimated && <NutritionSheet meal={meal} open={howOpen} onOpenChange={setHowOpen} />}
    </>
  );
}
