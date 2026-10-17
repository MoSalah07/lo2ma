'use client';

import { OTPInput, REGEXP_ONLY_DIGITS, type SlotProps } from 'input-otp';
import { cn } from '@/lib/cn';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length: number;
  /** Accessible name of the single underlying input, e.g. «كود التأكيد». */
  label: string;
  invalid?: boolean;
}

function Slot({ char, isActive, hasFakeCaret, invalid }: SlotProps & { invalid: boolean }) {
  return (
    <div
      className={cn(
        'flex h-15 flex-1 items-center justify-center rounded-18 bg-surface text-headline-sm font-bold ring-1 ring-line ring-inset',
        isActive && 'ring-2 ring-primary',
        invalid && 'ring-2 ring-on-danger',
      )}
    >
      {char}
      {hasFakeCaret && <span aria-hidden className="h-6 w-px bg-ink motion-safe:animate-pulse" />}
    </div>
  );
}

/**
 * Six boxes on screen, one real input underneath: paste, autofill from SMS (one-time-code) and screen
 * readers all work. Codes read left to right in both languages.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length,
  label,
  invalid = false,
}: OtpInputProps) {
  return (
    <OTPInput
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      maxLength={length}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      aria-label={label}
      aria-invalid={invalid || undefined}
      dir="ltr"
      containerClassName="flex gap-2"
      render={({ slots }) =>
        slots.map((slot, index) => <Slot key={index} {...slot} invalid={invalid} />)
      }
    />
  );
}
