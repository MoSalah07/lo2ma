import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Room kept free at the end of a screen, for what floats over it. */
const clearances = {
  /** Nothing floats: a little room before the edge. */
  end: 'pb-clear-end',
  /** The tab bar. */
  nav: 'pb-clear-nav',
  /** A bottom action without the tab bar (checkout, meal, onboarding). */
  action: 'pb-clear-action',
  /** The chat's message box above the tab bar. */
  composer: 'pb-clear-composer',
  /** A bottom action above the tab bar (the plan builder). */
  navAction: 'pb-clear-nav-action',
} as const;

export type Clearance = keyof typeof clearances;

interface ScreenProps extends ComponentProps<'div'> {
  /** What floats over the end of the screen, so the last block can scroll clear of it. */
  clear?: Clearance;
}

/** The body of an app screen: the gutter on both sides, the space between blocks and room at the end. */
export function Screen({ clear = 'end', className, ...props }: ScreenProps) {
  return (
    <div
      className={cn('flex flex-col gap-stack px-gutter', clearances[clear], className)}
      {...props}
    />
  );
}

interface ScreenHeaderProps {
  title: string;
  /** Something at the end of the title row, such as the week's dates. */
  children?: ReactNode;
}

/** The big title at the top of a tab screen, on the same gutter as the content under it. */
export function ScreenHeader({ title, children }: ScreenHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 px-gutter pt-gutter pb-3">
      <h1 className="text-26 leading-heading font-extrabold">{title}</h1>
      {children}
    </header>
  );
}
