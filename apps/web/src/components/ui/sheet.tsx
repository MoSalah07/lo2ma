'use client';

import { X } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { Dialog } from 'radix-ui';
import type { ReactNode } from 'react';
import { scrim, sheet } from '@/components/motion/presets';
import { IconButton } from './icon-button';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  closeLabel: string;
  children: ReactNode;
}

/**
 * A panel that slides up from the bottom (the sign-in gate, pickers). Radix handles focus trapping,
 * Escape to close and aria-modal, so keyboard and screen-reader users can't get lost behind it. Motion only
 * moves it: Radix keeps it mounted (forceMount) while AnimatePresence plays the way out.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  children,
}: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <m.div
                variants={scrim}
                initial="hidden"
                animate="shown"
                exit="hidden"
                className="fixed inset-0 z-40 bg-scrim"
              />
            </Dialog.Overlay>
            <Dialog.Content forceMount asChild aria-describedby={description ? undefined : ''}>
              <m.div
                variants={sheet}
                initial="hidden"
                animate="shown"
                exit="hidden"
                className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-app flex-col gap-4 rounded-t-32 bg-surface px-gutter pt-2.5 pb-6 shadow-sheet"
              >
                <span aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-line" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <Dialog.Title className="text-22 leading-heading font-extrabold">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="text-14 leading-body text-muted">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close asChild>
                    <IconButton label={closeLabel} icon={X} variant="subtle" />
                  </Dialog.Close>
                </div>
                {children}
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
