import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { focusRing } from './focus';
import { pressable } from './press';

/** Also used to style links that look like buttons: <Link className={buttonVariants({ … })}>. */
const buttonVariantsBase = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold',
    pressable,
    'disabled:pointer-events-none disabled:bg-divider disabled:text-muted',
    'aria-disabled:pointer-events-none aria-disabled:bg-divider aria-disabled:text-muted',
    focusRing,
  ],
  {
    variants: {
      // Hover changes only the fill, never the text, so contrast stays at 4.5:1 or better in both themes.
      variant: {
        primary: 'bg-primary text-on-primary hover:bg-primary-hover',
        tonal: 'bg-tint text-on-tint hover:bg-tint/80',
        outline: 'bg-surface text-ink ring-1 ring-line ring-inset hover:bg-surface-2',
        ghost: 'text-ink ring-1 ring-line ring-inset hover:bg-surface-2',
        link: 'text-primary-ink hover:underline disabled:bg-transparent aria-disabled:bg-transparent',
        /** A white button on a primary surface (the landing's last band, today's plan card). */
        onPrimary:
          'bg-on-primary text-primary-deep hover:bg-tint hover:text-on-tint focus-visible:outline-on-primary',
      },
      size: {
        lg: 'h-14 px-6 text-body-lg',
        md: 'h-12 px-5 text-body-md',
        sm: 'h-11 px-4 text-body-sm',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'lg' },
  },
);

/** Class names for this component, merged so a later class (like px-0) overrides the default. */
export const buttonVariants = (props?: Parameters<typeof buttonVariantsBase>[0]) =>
  cn(buttonVariantsBase(props));

export type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  block,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}
