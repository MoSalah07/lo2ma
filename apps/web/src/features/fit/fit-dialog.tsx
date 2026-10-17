'use client';

import {
  calculateFit,
  clampFitTarget,
  fitGoalAllowed,
  type CaloriePref,
  type FitCaloriePref,
  type FitTarget,
} from '@lo2ma/core';
import { X } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useTranslations } from 'next-intl';
import { Dialog } from 'radix-ui';
import { useState } from 'react';
import { fade, scrim } from '@/components/motion/presets';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { segmentedItem, segmentedRoot } from '@/components/ui/segmented';
import { defaultFitTarget } from '@/features/prefs/options';
import { cn } from '@/lib/cn';
import { calculatorSchema, FitCalculator, type CalculatorValues } from './fit-calculator';
import { FitManual } from './fit-manual';
import { useBodyProfile } from './profile-store';

export interface FitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The saved preference: a fit goal opens on it, anything else starts the calculator. */
  value: CaloriePref;
  onConfirm: (pref: FitCaloriePref) => void;
}

/** «وضع الفورمة»: full screen on a phone, the app's column on a desktop. */
export function FitDialog({ open, onOpenChange, value, onConfirm }: FitDialogProps) {
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
            <FitGoal
              value={value}
              onClose={() => onOpenChange(false)}
              onConfirm={(pref) => {
                onConfirm(pref);
                onOpenChange(false);
              }}
            />
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

const methods = ['calculate', 'manual'] as const;
type Method = (typeof methods)[number];

/** The dialog's insides, mounted on each opening so they start from the saved goal and body profile. */
function FitGoal({
  value,
  onClose,
  onConfirm,
}: {
  value: CaloriePref;
  onClose: () => void;
  onConfirm: (pref: FitCaloriePref) => void;
}) {
  const t = useTranslations();
  const saved = useBodyProfile((state) => state.profile);
  const remember = useBodyProfile((state) => state.remember);
  const current = value.mode === 'fit' ? value : null;

  // A goal typed by hand has no «هدف» behind it, so it reopens on the steppers.
  const [method, setMethod] = useState<Method>(current && !current.goal ? 'manual' : 'calculate');
  const [values, setValues] = useState<CalculatorValues>({
    goal: current?.goal ?? 'cut',
    sex: saved?.sex ?? null,
    age: saved?.age ?? null,
    heightCm: saved?.heightCm ?? null,
    weightKg: saved?.weightKg ?? null,
    training: saved?.training ?? 'moderate',
  });
  const [manual, setManual] = useState<FitTarget>(
    current ? { kcal: current.kcal, protein: current.protein } : defaultFitTarget,
  );

  const parsed = calculatorSchema.safeParse(values);
  const minor = parsed.success && !fitGoalAllowed(parsed.data.goal, parsed.data.age);
  const calculation = parsed.success && !minor ? calculateFit(parsed.data, parsed.data.goal) : null;

  function choose(next: Method) {
    // The steppers start at the goal just worked out, so «أنا عارف رقمي» can fine-tune it.
    if (next === 'manual' && calculation) setManual(clampFitTarget(calculation.lunch));
    setMethod(next);
  }

  function save() {
    if (method === 'manual') return onConfirm({ mode: 'fit', ...manual });
    if (!parsed.success || !calculation) return;
    const { goal, ...profile } = parsed.data;
    remember(profile);
    onConfirm({ mode: 'fit', goal, ...clampFitTarget(calculation.lunch) });
  }

  return (
    <Dialog.Content forceMount asChild>
      <m.div
        variants={fade}
        initial="hidden"
        animate="shown"
        exit="hidden"
        className="fixed inset-0 z-50 flex justify-center app:items-center app:p-8"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="flex size-full max-w-app flex-col overflow-hidden bg-bg app:h-dialog app:max-h-full app:rounded-panel app:shadow-sheet">
          <div className="px-bar pt-bar">
            <Dialog.Close asChild>
              <IconButton label={t('common.close')} icon={X} />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-stack px-gutter pt-2 pb-6">
              <div className="flex flex-col gap-1.5">
                <Dialog.Title className="text-headline-sm">{t('fit.title')}</Dialog.Title>
                <Dialog.Description className="text-body-md text-muted">
                  {t('fit.subtitle')}
                </Dialog.Description>
              </div>

              <div
                role="group"
                aria-label={t('fit.method')}
                className={cn(segmentedRoot, 'grid w-full grid-cols-2')}
              >
                {methods.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={method === option}
                    onClick={() => choose(option)}
                    className={segmentedItem({ active: method === option })}
                  >
                    {t(`fit.${option}`)}
                  </button>
                ))}
              </div>

              {method === 'calculate' ? (
                <FitCalculator
                  values={values}
                  onChange={(change) => setValues({ ...values, ...change })}
                  calculation={calculation}
                  minor={minor}
                />
              ) : (
                <FitManual
                  value={manual}
                  onChange={setManual}
                  onCalculate={() => choose('calculate')}
                />
              )}
            </div>
          </div>

          <div className="px-gutter pt-3 pb-screen-end">
            <Button block onClick={save} disabled={method === 'calculate' && !calculation}>
              {t('fit.save')}
            </Button>
          </div>
        </div>
      </m.div>
    </Dialog.Content>
  );
}
