import { cn } from '@/lib/cn';

// The look shared by every admin table: muted small headers, a hairline under each row but the last.

/** Scrolls sideways on narrow screens instead of squeezing the columns. */
export const tableScroll = 'overflow-x-auto';

export const tableClass = 'w-full border-collapse text-body-sm';

export const headCell = (align: 'start' | 'end' = 'start') =>
  cn(
    'h-11 border-b border-divider px-3 text-caption font-medium whitespace-nowrap text-muted',
    align === 'end' ? 'text-end' : 'text-start',
  );

export const rowClass = 'border-b border-divider last:border-b-0';

export const bodyCell = (align: 'start' | 'end' = 'start') =>
  cn('px-3 py-3.5', align === 'end' && 'text-end tabular-nums');
