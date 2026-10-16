import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface BottomActionProps {
  children: ReactNode;
  /** On tab screens the action sits above the tab bar. */
  aboveNav?: boolean;
}

/** The main action pinned to the bottom of the screen, over a fade so content scrolls under it. */
export function BottomAction({ children, aboveNav = false }: BottomActionProps) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 z-10 mx-auto flex max-w-app flex-col gap-2 bg-linear-to-b from-bg/0 via-bg/95 via-30% to-bg/95 px-gutter pt-4',
        aboveNav ? 'bottom-above-nav pb-1' : 'bottom-0 pb-screen-end',
      )}
    >
      {children}
    </div>
  );
}
