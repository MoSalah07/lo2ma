'use client';

import {
  formatCalories,
  formatGrams,
  formatPercent,
  GOAL_FACTORS,
  LUNCH_SHARE,
  PROTEIN_PER_KG,
  type FitCalculation,
  type FitGoal,
} from '@lo2ma/core';
import { ChevronDown, Info } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { Card } from '@/components/ui/card';
import { focusRing } from '@/components/ui/focus';
import { cn } from '@/lib/cn';

interface FitResultProps {
  calculation: FitCalculation;
  goal: FitGoal;
}

/** The lunch goal the calculator worked out, and every step of how («ازاي حسبناها»). */
export function FitResult({ calculation, goal }: FitResultProps) {
  const t = useTranslations('fit');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const stepsId = useId();
  const kcal = (value: number) => formatCalories(value, locale);
  const share = formatPercent(LUNCH_SHARE, locale);
  const perKg = PROTEIN_PER_KG[goal];

  const goalStep =
    goal === 'cut'
      ? t('steps.cut', { share: formatPercent(1 - GOAL_FACTORS.cut, locale) })
      : goal === 'bulk'
        ? t('steps.bulk', { share: formatPercent(GOAL_FACTORS.bulk - 1, locale) })
        : t('steps.keep');
  const steps = [
    { label: t('steps.rest'), value: kcal(calculation.restKcal) },
    { label: t('steps.training'), value: kcal(calculation.trainingKcal) },
    { label: goalStep, value: kcal(calculation.dailyKcal) },
    { label: t('steps.lunch', { share }), value: kcal(calculation.lunch.kcal), strong: true },
    {
      label: t('steps.protein', {
        grams: formatGrams(perKg, locale, Number.isInteger(perKg) ? 0 : 1),
      }),
      value: formatGrams(calculation.dailyProtein, locale),
    },
  ];

  return (
    <>
      <section
        aria-labelledby={titleId}
        className="flex flex-col gap-3 rounded-card bg-tint p-4 text-on-tint"
      >
        <h2 id={titleId} className="text-label-md">
          {t('result')}
        </h2>
        <dl aria-live="polite" className="grid grid-cols-2 gap-2">
          <div className="flex flex-col-reverse gap-0.5">
            <dt className="text-body-sm">{t('calories')}</dt>
            <dd className="text-headline-md">{kcal(calculation.lunch.kcal)}</dd>
          </div>
          <div className="flex flex-col-reverse gap-0.5">
            <dt className="text-body-sm">{t('protein')}</dt>
            <dd className="text-headline-md">{formatGrams(calculation.lunch.protein, locale)}</dd>
          </div>
        </dl>
        <p className="text-body-sm">
          {t('ofDay', { calories: kcal(calculation.dailyKcal), share })}
        </p>
        {calculation.raisedToFloor && (
          <p className="flex items-start gap-1.5 text-caption">
            <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            {t('raised', { calories: kcal(calculation.dailyKcal) })}
          </p>
        )}
      </section>

      <Card className="px-4">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={stepsId}
          onClick={() => setOpen(!open)}
          className={cn(
            'flex h-12 w-full items-center gap-2 text-body-md font-semibold',
            focusRing,
          )}
        >
          <span className="flex-1 text-start">{t('how')}</span>
          <ChevronDown
            aria-hidden
            className={cn('size-4.5 text-muted transition-transform', open && 'rotate-180')}
          />
        </button>
        {open && (
          <dl id={stepsId} className="divide-y divide-divider border-t border-divider">
            {steps.map((step) => (
              <div key={step.label} className="flex min-h-10 items-center gap-2 py-2 text-body-sm">
                <dt className="flex-1 text-ink-2">{step.label}</dt>
                <dd className={step.strong ? 'font-bold' : 'font-semibold'}>{step.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Card>
    </>
  );
}
