'use client';

import type { Workplace } from '@lo2ma/core';
import { MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { focusRing } from '@/components/ui/focus';
import { preloadLocationPicker } from '@/features/location/preload';
import { WorkplaceSummary } from '@/features/location/workplace-summary';
import { cn } from '@/lib/cn';

// Onboarding only might open it, so its code comes when it is about to be used.
const LocationPicker = dynamic(
  () => import('@/features/location/location-picker').then((module) => module.LocationPicker),
  { ssr: false },
);

interface WorkplaceFieldProps {
  value: Workplace;
  onChange: (workplace: Workplace) => void;
  labelId: string;
}

/** The chosen workplace, with its district and the courier's notes; «غيّر» opens the map. */
export function WorkplaceField({ value, onChange, labelId }: WorkplaceFieldProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  // Mounted from the first opening on, so it can also play its way out when it closes.
  const [used, setUsed] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-labelledby={labelId}
        aria-describedby={`${labelId}-value`}
        onClick={() => {
          setUsed(true);
          setOpen(true);
        }}
        // The picker and its map start loading at the first sign of interest.
        onPointerEnter={preloadLocationPicker}
        onFocus={preloadLocationPicker}
        className={cn(
          'flex min-h-14 items-center gap-2.5 rounded-20 bg-surface px-4 py-2.5 ring-1 ring-line ring-inset',
          focusRing,
        )}
      >
        <MapPin aria-hidden className="size-5 shrink-0 text-primary" />
        <WorkplaceSummary workplace={value} id={`${labelId}-value`} className="flex-1" />
        <span className="text-13 font-semibold text-primary-ink">{t('common.change')}</span>
      </button>
      {used && (
        <LocationPicker open={open} onOpenChange={setOpen} value={value} onConfirm={onChange} />
      )}
    </>
  );
}
