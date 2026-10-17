'use client';

import { FIT_LUNCH_LIMITS, formatCalories, formatGrams, type FitTarget } from '@lo2ma/core';
import { Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Stepper } from '@/components/stepper';
import { Button } from '@/components/ui/button';
import { OptionGroup } from '@/components/ui/option-group';

interface FitManualProps {
  value: FitTarget;
  onChange: (value: FitTarget) => void;
  /** «احسبهولي», for someone who doesn't know their numbers after all. */
  onCalculate: () => void;
}

/** «أنا عارف رقمي»: the lunch goal set by hand. */
export function FitManual({ value, onChange, onCalculate }: FitManualProps) {
  const t = useTranslations('fit');
  const locale = useLocale();
  const { kcal, protein } = FIT_LUNCH_LIMITS;

  return (
    <>
      <OptionGroup legend={t('lunchCalories')}>
        <Stepper
          value={value.kcal}
          onChange={(next) => onChange({ ...value, kcal: next })}
          min={kcal.min}
          max={kcal.max}
          step={kcal.step}
          format={(next) => formatCalories(next, locale)}
          decreaseLabel={t('lessCalories')}
          increaseLabel={t('moreCalories')}
        />
      </OptionGroup>

      <OptionGroup legend={t('lunchProtein')}>
        <Stepper
          value={value.protein}
          onChange={(next) => onChange({ ...value, protein: next })}
          min={protein.min}
          max={protein.max}
          step={protein.step}
          format={(next) => formatGrams(next, locale)}
          decreaseLabel={t('lessProtein')}
          increaseLabel={t('moreProtein')}
        />
      </OptionGroup>

      <p className="flex items-start gap-2.5 rounded-card bg-accent px-4 py-3.5 text-body-sm text-on-accent">
        <Sparkles aria-hidden className="mt-0.5 size-5 shrink-0" />
        {t('estimateNote')}
      </p>

      <p className="flex flex-wrap items-center gap-x-1.5 text-body-sm text-muted">
        {t('dontKnow')}
        <Button type="button" variant="link" size="sm" className="px-0" onClick={onCalculate}>
          {t('calculate')}
        </Button>
      </p>
    </>
  );
}
