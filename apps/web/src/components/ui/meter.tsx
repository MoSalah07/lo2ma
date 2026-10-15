import { cn } from '@/lib/cn';

interface MeterProps {
  /** From 0 to 1. */
  value: number;
  /** Accessible name, e.g. «من ميزانيتك». */
  label: string;
  className?: string;
  tone?: 'primary' | 'onPrimary';
}

/** A thin bar for how much of something is used (budget, coupon uses, order progress). */
export function Meter({ value, label, className, tone = 'primary' }: MeterProps) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn(
        'h-1.5 overflow-hidden rounded-full',
        tone === 'primary' ? 'bg-line' : 'bg-on-primary/30',
        className,
      )}
    >
      <div
        className={cn('h-full rounded-full', tone === 'primary' ? 'bg-primary' : 'bg-on-primary')}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
