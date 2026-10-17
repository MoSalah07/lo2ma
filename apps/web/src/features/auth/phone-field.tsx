'use client';

import { EGYPT_DIAL_CODE, EGYPT_MOBILE_EXAMPLE } from '@lo2ma/core';
import { Field } from '@/components/ui/field';
import { focusRing } from '@/components/ui/focus';
import { cn } from '@/lib/cn';

interface PhoneFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  surface?: 'surface' | 'bg';
}

/** An Egyptian mobile field: +20 before the number, always left to right, numeric keyboard on phones. */
export function PhoneField({
  label,
  value,
  onChange,
  hint,
  error,
  surface = 'surface',
}: PhoneFieldProps) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(control) => (
        <div
          dir="ltr"
          className={cn(
            'flex h-control-lg items-center gap-3 rounded-control px-4 ring-1 ring-line ring-inset',
            'focus-within:ring-2 focus-within:ring-primary',
            error && 'ring-2 ring-on-danger',
            surface === 'surface' ? 'bg-surface' : 'bg-bg',
          )}
        >
          <span className="text-body-md font-semibold text-ink-2">{EGYPT_DIAL_CODE}</span>
          <span aria-hidden className="h-6 w-px bg-line" />
          <input
            {...control}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder={EGYPT_MOBILE_EXAMPLE}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={cn(
              'h-11 min-w-0 flex-1 bg-transparent text-body-lg text-ink outline-none placeholder:text-muted',
              focusRing,
            )}
          />
        </div>
      )}
    </Field>
  );
}
