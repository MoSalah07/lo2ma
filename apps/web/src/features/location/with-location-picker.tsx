'use client';

import type { Workplace } from '@lo2ma/core';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { useDialogTrigger, type DialogTrigger } from '@/lib/use-dialog-trigger';

// Screens only might open the picker, so its code (and the map's) comes when it is about to be used.
const LocationPicker = dynamic(
  () => import('./location-picker').then((module) => module.LocationPicker),
  { ssr: false },
);

function preload() {
  void import('./location-picker');
  void import('./map-view');
}

interface WithLocationPickerProps {
  value: Workplace;
  onConfirm: (workplace: Workplace) => void;
  /** Renders the trigger (a field, a chip, a row) with the props that open the picker. */
  children: (trigger: DialogTrigger) => ReactNode;
}

/** Lets any element open the location picker. The map's code comes with it, on hover or focus. */
export function WithLocationPicker({ value, onConfirm, children }: WithLocationPickerProps) {
  const { open, setOpen, used, trigger } = useDialogTrigger(preload);
  return (
    <>
      {children(trigger)}
      {used && (
        <LocationPicker open={open} onOpenChange={setOpen} value={value} onConfirm={onConfirm} />
      )}
    </>
  );
}
