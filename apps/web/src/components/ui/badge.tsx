import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

const badgeVariantsBase = cva(
  'inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-2 text-ink-2',
        inverse: 'bg-inverse text-on-inverse',
        tint: 'bg-tint text-on-tint',
        accent: 'bg-accent text-on-accent',
        highlight: 'bg-highlight text-on-highlight',
        good: 'bg-good text-on-good',
        warn: 'bg-warn text-on-warn',
        danger: 'bg-danger text-on-danger',
        /** On a primary-colored surface, such as the tracking card. Solid, so white text keeps 4.5:1. */
        onPrimary: 'bg-primary-deep text-on-primary',
      },
      size: {
        sm: 'h-5.5 px-2.5 text-caption-sm',
        md: 'h-7 px-3 text-caption',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'sm' },
  },
);

/** Class names for this component, merged so a later class (like px-0) overrides the default. */
export const badgeVariants = (props?: Parameters<typeof badgeVariantsBase>[0]) =>
  cn(badgeVariantsBase(props));

export type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

export function Badge({ tone, size, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}
