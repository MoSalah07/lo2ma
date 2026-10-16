import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { focusRing } from './focus';
import { pressable } from './press';

/** Also used for icon links (back, close): <Link className={iconButtonVariants()} aria-label={…}>. */
const iconButtonVariantsBase = cva(
  [
    'inline-flex size-11 shrink-0 items-center justify-center rounded-full',
    pressable,
    'disabled:pointer-events-none disabled:opacity-50',
    focusRing,
  ],
  {
    variants: {
      variant: {
        surface: 'bg-surface text-ink ring-1 ring-line ring-inset',
        subtle: 'bg-surface-2 text-ink',
        tint: 'bg-tint text-on-tint',
        primary: 'bg-primary text-on-primary',
        ghost: 'text-muted hover:text-ink',
      },
    },
    defaultVariants: { variant: 'surface' },
  },
);

/** Class names for this component, merged so a later class (like px-0) overrides the default. */
export const iconButtonVariants = (props?: Parameters<typeof iconButtonVariantsBase>[0]) =>
  cn(iconButtonVariantsBase(props));

type IconButtonProps = Omit<ComponentProps<'button'>, 'aria-label' | 'children'> &
  VariantProps<typeof iconButtonVariants> & {
    /** Required: an icon alone has no accessible name. */
    label: string;
    icon: LucideIcon;
    /** Arrows and chevrons point the other way in Arabic. */
    flipInRtl?: boolean;
  };

export function IconButton({
  label,
  icon: Icon,
  flipInRtl = false,
  variant,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(iconButtonVariants({ variant }), className)}
      {...props}
    >
      <Icon aria-hidden className={cn('size-5', flipInRtl && 'rtl:rotate-180')} />
    </button>
  );
}
