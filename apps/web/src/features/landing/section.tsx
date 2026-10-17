import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/**
 * A part of the page that stays dark in both themes (the photo cards and the last band): the tokens inside
 * take their dark values, so text and surfaces stay readable over food photos.
 */
export const alwaysDark = 'dark bg-bg text-ink';

/** The landing page's column: the same max width and side padding for the header, every band and the footer. */
export const landingColumn = 'mx-auto w-full max-w-site px-gutter md:px-gutter-md lg:px-gutter-lg';

/** One band of the landing page. */
export function Section({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section className={cn(landingColumn, 'py-section lg:py-section-lg', className)} {...props} />
  );
}

export function SectionTitle({ className, children, ...props }: ComponentProps<'h2'>) {
  return (
    <h2
      className={cn('text-headline-sm lg:text-headline-md xl:text-headline-lg', className)}
      {...props}
    >
      {children}
    </h2>
  );
}
