import { Soup } from 'lucide-react';
import { cn } from '@/lib/cn';

const sizes = {
  sm: { box: 'size-10 rounded-control', icon: 'size-5' },
  md: { box: 'size-13 rounded-control', icon: 'size-6.5' },
  hero: { box: 'h-30 w-full rounded-card', icon: 'size-15' },
} as const;

/** The tinted bowl that stands in for a meal photo until restaurants send real ones. */
export function MealIcon({ size = 'md' }: { size?: keyof typeof sizes }) {
  return (
    <span
      aria-hidden
      className={cn('flex shrink-0 items-center justify-center bg-tint', sizes[size].box)}
    >
      <Soup className={cn('text-primary-ink', sizes[size].icon)} strokeWidth={1.6} />
    </span>
  );
}
