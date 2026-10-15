import { cn } from '@/lib/cn';

/** A placeholder block while data loads. It only pulses for people who allow motion. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('rounded-16 bg-surface-2 motion-safe:animate-pulse', className)}
    />
  );
}
