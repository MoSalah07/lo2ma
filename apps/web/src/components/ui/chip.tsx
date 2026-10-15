import { cva } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { focusRing } from './focus';

const chipVariants = cva(
  [
    'inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-14 transition-colors',
    focusRing,
  ],
  {
    variants: {
      look: {
        idle: 'bg-surface font-medium text-ink ring-1 ring-line ring-inset',
        inverse: 'bg-inverse font-semibold text-on-inverse',
        tint: 'bg-tint font-semibold text-on-tint',
      },
    },
    defaultVariants: { look: 'idle' },
  },
);

type ChipProps = ComponentProps<'button'> & {
  /** Set for toggles (break time, calories, foods to avoid); leave undefined for one-tap actions. */
  pressed?: boolean;
  /** How a pressed chip looks: inverse for single choice, tint for multiple choice. */
  pressedLook?: 'inverse' | 'tint';
};

export function Chip({ pressed, pressedLook = 'inverse', className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(chipVariants({ look: pressed ? pressedLook : 'idle' }), className)}
      {...props}
    />
  );
}
