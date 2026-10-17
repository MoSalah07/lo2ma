'use client';

import type { Workplace } from '@lo2ma/core';
import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { focusRing } from '@/components/ui/focus';
import { WithLocationPicker } from '@/features/location/with-location-picker';
import { WorkplaceSummary } from '@/features/location/workplace-summary';
import { cn } from '@/lib/cn';

interface WorkplaceFieldProps {
  value: Workplace;
  onChange: (workplace: Workplace) => void;
  labelId: string;
}

/** The chosen workplace, with its district and the courier's notes; «غيّر» opens the map. */
export function WorkplaceField({ value, onChange, labelId }: WorkplaceFieldProps) {
  const t = useTranslations();

  return (
    <WithLocationPicker value={value} onConfirm={onChange}>
      {(trigger) => (
        <button
          type="button"
          aria-labelledby={labelId}
          aria-describedby={`${labelId}-value`}
          {...trigger}
          className={cn(
            'flex min-h-14 items-center gap-2.5 rounded-20 bg-surface px-4 py-2.5 ring-1 ring-line ring-inset',
            focusRing,
          )}
        >
          <MapPin aria-hidden className="size-5 shrink-0 text-primary" />
          <WorkplaceSummary workplace={value} id={`${labelId}-value`} className="flex-1" />
          <span className="text-13 font-semibold text-primary-ink">{t('common.change')}</span>
        </button>
      )}
    </WithLocationPicker>
  );
}
