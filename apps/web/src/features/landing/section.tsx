import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/** The landing page's column: the same max width and side padding for the header, every band and the footer. */
export const landingColumn = 'mx-auto w-full max-w-300 px-5 md:px-8 lg:px-12';

/** One band of the landing page. */
export function Section({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn(landingColumn, 'py-8 lg:py-14', className)} {...props} />;
}

export function SectionTitle({ className, children, ...props }: ComponentProps<'h2'>) {
  return (
    <h2
      className={cn('text-26 leading-heading font-extrabold lg:text-30 xl:text-34', className)}
      {...props}
    >
      {children}
    </h2>
  );
}
