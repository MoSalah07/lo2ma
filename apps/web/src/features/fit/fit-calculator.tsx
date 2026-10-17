'use client';

import {
  BODY_LIMITS,
  bodyProfileSchema,
  FIT_MIN_CUT_AGE,
  fitGoalSchema,
  parseWholeNumber,
  sexSchema,
  trainingDaysSchema,
  type FitCalculation,
  type FitGoal,
  type Sex,
  type TrainingDays,
} from '@lo2ma/core';
import { Lock, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Chip } from '@/components/ui/chip';
import { Field, Input } from '@/components/ui/field';
import { focusRing } from '@/components/ui/focus';
import { OptionGroup } from '@/components/ui/option-group';
import { pressable } from '@/components/ui/press';
import { segmentedItem, segmentedRoot } from '@/components/ui/segmented';
import { cn } from '@/lib/cn';
import { FitResult } from './fit-result';

/** The calculator's answers, as the form holds them: a number field can be empty. */
export interface CalculatorValues {
  goal: FitGoal;
  sex: Sex | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  training: TrainingDays;
}

export const calculatorSchema = bodyProfileSchema.extend({ goal: fitGoalSchema });

type BodyField = keyof typeof BODY_LIMITS;
const bodyFields = Object.keys(BODY_LIMITS) as BodyField[];

interface FitCalculatorProps {
  values: CalculatorValues;
  onChange: (change: Partial<CalculatorValues>) => void;
  /** Null until every answer is in, or when the goal isn't safe at this age. */
  calculation: FitCalculation | null;
  /** Under 18 and cutting: the result gives way to a notice. */
  minor: boolean;
}

/** «احسبهولي»: the goal, the body and the training days, and the lunch goal they give, live. */
export function FitCalculator({ values, onChange, calculation, minor }: FitCalculatorProps) {
  const t = useTranslations('fit');
  // A field shows its error once the user has left it, not while they are still typing.
  const [left, setLeft] = useState<ReadonlySet<BodyField>>(new Set());

  return (
    <>
      <OptionGroup legend={t('goal')}>
        <div className="grid grid-cols-3 gap-2">
          {fitGoalSchema.options.map((goal) => {
            const picked = values.goal === goal;
            return (
              <button
                key={goal}
                type="button"
                aria-pressed={picked}
                onClick={() => onChange({ goal })}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-0.5 rounded-control px-1.5',
                  picked
                    ? 'bg-tint text-on-tint ring-2 ring-primary ring-inset'
                    : 'bg-surface ring-1 ring-line ring-inset',
                  pressable,
                  focusRing,
                )}
              >
                <span className="text-title-sm">{t(`goals.${goal}`)}</span>
                <span className={cn('text-caption-sm', !picked && 'text-muted')}>
                  {t(`goalHints.${goal}`)}
                </span>
              </button>
            );
          })}
        </div>
      </OptionGroup>

      <OptionGroup legend={t('sex')}>
        <div className={cn(segmentedRoot, 'grid w-full grid-cols-2')}>
          {sexSchema.options.map((sex) => (
            <button
              key={sex}
              type="button"
              aria-pressed={values.sex === sex}
              onClick={() => onChange({ sex })}
              className={segmentedItem({ active: values.sex === sex })}
            >
              {t(`sexes.${sex}`)}
            </button>
          ))}
        </div>
      </OptionGroup>

      <div className="grid grid-cols-3 gap-2">
        {bodyFields.map((name) => {
          const value = values[name];
          const invalid = left.has(name) && !bodyProfileSchema.shape[name].safeParse(value).success;
          return (
            <Field
              key={name}
              label={t(name)}
              error={
                invalid
                  ? t('outOfRange', {
                      min: String(BODY_LIMITS[name].min),
                      max: String(BODY_LIMITS[name].max),
                    })
                  : undefined
              }
              className="min-w-0"
            >
              {(control) => (
                <Input
                  {...control}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={3}
                  value={value ?? ''}
                  onChange={(event) => {
                    const change: Partial<CalculatorValues> = {};
                    change[name] = parseWholeNumber(event.target.value);
                    onChange(change);
                  }}
                  onBlur={() => setLeft(new Set(left).add(name))}
                />
              )}
            </Field>
          );
        })}
      </div>

      <OptionGroup legend={t('training')}>
        <div className="grid grid-cols-4 gap-2">
          {trainingDaysSchema.options.map((training) => (
            <Chip
              key={training}
              pressed={values.training === training}
              onClick={() => onChange({ training })}
              className="px-1"
            >
              {t(`trainingDays.${training}`)}
            </Chip>
          ))}
        </div>
      </OptionGroup>

      {minor ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-card bg-warn px-4 py-3.5 text-on-warn"
        >
          <TriangleAlert aria-hidden className="size-5 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <strong className="text-title-sm">
              {t('minorTitle', { age: String(FIT_MIN_CUT_AGE) })}
            </strong>
            <span className="text-body-sm">{t('minorBody')}</span>
          </div>
        </div>
      ) : calculation ? (
        <FitResult calculation={calculation} goal={values.goal} />
      ) : (
        <p className="text-body-sm text-muted">{t('fillToSee')}</p>
      )}

      <div className="flex flex-col gap-1.5 text-caption text-muted">
        <p className="flex items-start gap-1.5">
          <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {t('privacy')}
        </p>
        <p>{t('disclaimer')}</p>
      </div>
    </>
  );
}
