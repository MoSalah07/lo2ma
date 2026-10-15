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
        'fixed inset-x-0 z-10 mx-auto flex max-w-md flex-col gap-2 bg-linear-to-b from-bg/0 via-bg/95 via-30% to-bg/95 px-5 pt-4',
        aboveNav
          ? 'bottom-[calc(5.75rem+env(safe-area-inset-bottom))] pb-1'
          : 'bottom-0 pb-[calc(1.375rem+env(safe-area-inset-bottom))]',
      )}
    >
      {children}
    </div>
  );
}
