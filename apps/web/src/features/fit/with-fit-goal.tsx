'use client';

import type { CaloriePref, FitCaloriePref } from '@lo2ma/core';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { useDialogTrigger, type DialogTrigger } from '@/lib/use-dialog-trigger';

// Most visits never open it, so the calculator's code comes when it is about to be used.
const FitDialog = dynamic(() => import('./fit-dialog').then((module) => module.FitDialog), {
  ssr: false,
});

function preload() {
  void import('./fit-dialog');
}

interface WithFitGoalProps {
  value: CaloriePref;
  onConfirm: (pref: FitCaloriePref) => void;
  /** Renders the triggers (the «وضع الفورمة» chip, the goal's summary) with the props that open the dialog. */
  children: (trigger: DialogTrigger) => ReactNode;
}

/** Lets any element open «وضع الفورمة» and hand back the goal it saves. */
export function WithFitGoal({ value, onConfirm, children }: WithFitGoalProps) {
  const { open, setOpen, used, trigger } = useDialogTrigger(preload);
  return (
    <>
      {children(trigger)}
      {used && <FitDialog open={open} onOpenChange={setOpen} value={value} onConfirm={onConfirm} />}
    </>
  );
}
