'use client';

import type { Workplace } from '@lo2ma/core';
import dynamic from 'next/dynamic';
import { useState, type ReactNode } from 'react';

// Screens only might open the picker, so its code (and the map's) comes when it is about to be used.
const LocationPicker = dynamic(
  () => import('./location-picker').then((module) => module.LocationPicker),
  { ssr: false },
);

function preload() {
  void import('./location-picker');
  void import('./map-view');
}

/** What the element that opens the picker spreads on itself. */
export interface PickerTrigger {
  onClick: () => void;
  onPointerEnter: () => void;
  onFocus: () => void;
  'aria-haspopup': 'dialog';
}

interface WithLocationPickerProps {
  value: Workplace;
  onConfirm: (workplace: Workplace) => void;
  /** Renders the trigger (a field, a chip, a row) with the props that open the picker. */
  children: (trigger: PickerTrigger) => ReactNode;
}

/**
 * Lets any element open the location picker: the picker and the map start downloading on hover or focus, open on
 * click, and stay mounted after the first opening so the picker can play its way out when it closes.
 */
export function WithLocationPicker({ value, onConfirm, children }: WithLocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(false);

  return (
    <>
      {children({
        onClick: () => {
          setUsed(true);
          setOpen(true);
        },
        onPointerEnter: preload,
        onFocus: preload,
        'aria-haspopup': 'dialog',
      })}
      {used && (
        <LocationPicker open={open} onOpenChange={setOpen} value={value} onConfirm={onConfirm} />
      )}
    </>
  );
}
