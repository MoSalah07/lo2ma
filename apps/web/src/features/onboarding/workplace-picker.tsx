'use client';

import type { Workplace } from '@lo2ma/core';
import { MapPin } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { focusRing } from '@/components/ui/focus';
import { Sheet } from '@/components/ui/sheet';
import { useWorkplaces } from '@/features/prefs/api';
import { cn } from '@/lib/cn';

interface WorkplacePickerProps {
  value: Workplace;
  onChange: (workplace: Workplace) => void;
  labelId: string;
}

/** Shows the chosen workplace; «غيّر» opens a sheet with the places we deliver to. */
export function WorkplacePicker({ value, onChange, labelId }: WorkplacePickerProps) {
  const t = useTranslations();
  const locale = useLocale();
  const workplaces = useWorkplaces();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-labelledby={labelId}
        aria-describedby={`${labelId}-value`}
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-14 items-center gap-2.5 rounded-20 bg-surface px-4 ring-1 ring-line ring-inset',
          focusRing,
        )}
      >
        <MapPin aria-hidden className="size-5 shrink-0 text-primary" />
        <span id={`${labelId}-value`} className="flex-1 text-start text-15 font-medium">
          {value.name[locale]}
        </span>
        <span className="text-13 font-semibold text-primary-ink">{t('common.change')}</span>
      </button>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={t('onboarding.chooseWorkplace')}
        closeLabel={t('common.close')}
      >
        <fieldset className="flex flex-col">
          <legend className="sr-only">{t('onboarding.chooseWorkplace')}</legend>
          {workplaces.data?.map((workplace) => (
            <label
              key={workplace.id}
              className="flex h-13 cursor-pointer items-center gap-3 text-15"
            >
              <input
                type="radio"
                name="workplace"
                checked={workplace.id === value.id}
                onChange={() => {
                  onChange(workplace);
                  setOpen(false);
                }}
                className="size-5 accent-primary"
              />
              {workplace.name[locale]}
            </label>
          ))}
        </fieldset>
      </Sheet>
    </>
  );
}
