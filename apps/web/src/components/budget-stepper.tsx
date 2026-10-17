'use client';

import { Minus, Plus } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';

interface BudgetStepperProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  /** Turns the value into display text, e.g. formatMoney. */
  format: (value: number) => string;
  decreaseLabel: string;
  increaseLabel: string;
}

/** − 150 ج + : the budget picker from onboarding. The value is announced when it changes. */
export function BudgetStepper({
  value,
  onChange,
  min,
  max,
  step,
  format,
  decreaseLabel,
  increaseLabel,
}: BudgetStepperProps) {
  return (
    <div className="flex h-16 items-center justify-between rounded-22 bg-surface px-2.5 ring-1 ring-line ring-inset">
      <IconButton
        label={decreaseLabel}
        icon={Minus}
        variant="tint"
        disabled={value - step < min}
        onClick={() => onChange(Math.max(min, value - step))}
      />
      <output aria-live="polite" className="text-headline-sm">
        {format(value)}
      </output>
      <IconButton
        label={increaseLabel}
        icon={Plus}
        variant="tint"
        disabled={value + step > max}
        onClick={() => onChange(Math.min(max, value + step))}
      />
    </div>
  );
}
