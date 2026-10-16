import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';

interface PlanRowProps {
  /** «الأحد» / «Sun». */
  weekday: string;
  /** The day of the month, «18». */
  day: string;
  meal: string;
  /** The line under the meal: its price and calories, or when it is ordered. */
  meta: string;
  /** The plan builder uses the large date tile; previews and the current plan use the medium one. */
  size?: 'md' | 'lg';
  /** A day that is over reads a little quieter. */
  done?: boolean;
  /** The swap button or a status badge, at the end of the row. */
  children?: ReactNode;
}

/** One workday of a weekly plan: the date tile (weekday over day), the meal and a line about it. */
export function PlanRow({
  weekday,
  day,
  meal,
  meta,
  size = 'md',
  done = false,
  children,
}: PlanRowProps) {
  const large = size === 'lg';
  return (
    <Card className={cn('flex items-center gap-3 rounded-22 px-3', large ? 'py-2.5' : 'py-2')}>
      <div
        className={cn(
          'flex shrink-0 flex-col items-center justify-center rounded-16 bg-surface-2',
          large ? 'size-13' : 'size-12',
        )}
      >
        <span className="text-11 text-muted">{weekday}</span>
        <span className={cn('leading-tight font-bold', large ? 'text-18' : 'text-16')}>{day}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn('truncate text-14 font-semibold', done && 'text-ink-2')}>{meal}</span>
        <span className="text-12 text-muted">{meta}</span>
      </div>
      {children}
    </Card>
  );
}
