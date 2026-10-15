import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/** The white (or dark) rounded surface most content sits on. */
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-24 bg-surface shadow-card', className)} {...props} />;
}
