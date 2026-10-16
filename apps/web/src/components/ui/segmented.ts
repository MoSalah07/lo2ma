import { cn } from '@/lib/cn';
import { cva } from 'class-variance-authority';
import { focusRing } from './focus';
import { pressable } from './press';

/** The pill track behind a segmented control (language, theme, discount type). */
export const segmentedRoot = 'flex w-fit gap-0.5 rounded-full bg-surface-2 p-0.5';

/** One option inside the track. The selected one is raised. */
const segmentedItemBase = cva(
  [
    'inline-flex h-11 items-center justify-center rounded-full px-3.5 text-13 font-semibold',
    pressable,
    focusRing,
  ],
  {
    variants: {
      active: {
        true: 'bg-surface-raised text-ink shadow-segment',
        false: 'text-muted hover:text-ink',
      },
    },
    defaultVariants: { active: false },
  },
);

/** Class names for this component, merged so a later class (like px-0) overrides the default. */
export const segmentedItem = (props?: Parameters<typeof segmentedItemBase>[0]) =>
  cn(segmentedItemBase(props));
