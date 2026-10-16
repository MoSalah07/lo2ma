'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  BREAK_TIMES,
  BUDGET_STEP,
  formatMoney,
  formatTime,
  userPrefsSchema,
  type UserPrefs,
} from '@lo2ma/core';
import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Screen } from '@/components/screen';
import { BottomAction } from '@/components/bottom-action';
import { BudgetStepper } from '@/components/budget-stepper';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { usePrefs, useSavePrefs, useWorkplaces } from '@/features/prefs/api';
import {
  budgetLimits,
  calorieOptions,
  defaultPrefs,
  ingredients,
  sameCalories,
  useCalorieLabel,
} from '@/features/prefs/options';
import { useRouter } from '@/i18n/navigation';
import { WorkplacePicker } from './workplace-picker';

function Group({
  legend,
  aside,
  children,
}: {
  legend: string;
  aside?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <legend className="text-13 font-semibold text-ink-2">{legend}</legend>
        {aside && <span className="text-12 text-muted">{aside}</span>}
      </div>
      {children}
    </fieldset>
  );
}

/** The title and its line. They show at once, before the saved preferences arrive. */
function OnboardingIntro() {
  const t = useTranslations('onboarding');
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-28 leading-heading font-extrabold">{t('title')}</h1>
      <p className="text-15 text-muted">{t('subtitle')}</p>
    </div>
  );
}

/** Loads the saved preferences (or sensible defaults) and only then shows the form's fields. */
export function OnboardingForm() {
  const prefs = usePrefs();
  const workplaces = useWorkplaces();

  if (prefs.isPending || workplaces.isPending) {
    return (
      <Screen clear="action" className="pt-2">
        <OnboardingIntro />
        <LoadingBlocks count={4} />
      </Screen>
    );
  }
  const fallback = workplaces.data?.[0];
  const initial = prefs.data ?? (fallback ? defaultPrefs(fallback) : undefined);
  if (!initial) return <ErrorMessage onRetry={() => void workplaces.refetch()} />;

  return <PrefsForm initial={initial} />;
}

/** «خلّينا نظبطلك الغدا»: workplace, break, budget, calories and foods to avoid. Also used to edit them. */
function PrefsForm({ initial }: { initial: UserPrefs }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const save = useSavePrefs();
  const calorieLabel = useCalorieLabel();
  const workplaceLabelId = useId();
  const form = useForm<UserPrefs>({
    resolver: zodResolver(userPrefsSchema),
    defaultValues: initial,
  });

  const submit = form.handleSubmit((values) =>
    save.mutate(values, { onSuccess: () => router.push('/chat') }),
  );

  return (
    <form onSubmit={(event) => void submit(event)} noValidate>
      <Screen clear="action" className="pt-2">
        <OnboardingIntro />

        <div className="flex flex-col gap-2">
          <span id={workplaceLabelId} className="text-13 font-semibold text-ink-2">
            {t('prefs.workplace')}
          </span>
          <Controller
            control={form.control}
            name="workplace"
            render={({ field }) => (
              <WorkplacePicker
                value={field.value}
                onChange={field.onChange}
                labelId={workplaceLabelId}
              />
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="breakTime"
          render={({ field }) => (
            <Group legend={t('prefs.breakTime')}>
              <div className="grid grid-cols-4 gap-2">
                {BREAK_TIMES.map((time) => (
                  <Chip
                    key={time}
                    pressed={field.value === time}
                    onClick={() => field.onChange(time)}
                  >
                    {formatTime(time)}
                  </Chip>
                ))}
              </div>
            </Group>
          )}
        />

        <Controller
          control={form.control}
          name="budget"
          render={({ field }) => (
            <Group
              legend={t('prefs.budget')}
              aside={t('onboarding.minOrder', { amount: formatMoney(budgetLimits.min, locale) })}
            >
              <BudgetStepper
                value={field.value}
                onChange={field.onChange}
                min={budgetLimits.min}
                max={budgetLimits.max}
                step={BUDGET_STEP}
                format={(value) => formatMoney(value, locale)}
                decreaseLabel={t('onboarding.decreaseBudget')}
                increaseLabel={t('onboarding.increaseBudget')}
              />
            </Group>
          )}
        />

        <Controller
          control={form.control}
          name="calories"
          render={({ field }) => (
            <Group legend={t('prefs.calories')}>
              <div className="flex flex-wrap gap-2">
                {calorieOptions.map((option) => (
                  <Chip
                    key={option.mode}
                    pressed={sameCalories(field.value, option)}
                    onClick={() => field.onChange(option)}
                  >
                    {calorieLabel(option)}
                  </Chip>
                ))}
              </div>
            </Group>
          )}
        />

        <Controller
          control={form.control}
          name="exclusions"
          render={({ field }) => (
            <Group legend={t('onboarding.avoidQuestion')}>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ingredient) => {
                  const avoided = field.value.includes(ingredient);
                  return (
                    <Chip
                      key={ingredient}
                      pressed={avoided}
                      pressedLook="tint"
                      onClick={() =>
                        field.onChange(
                          avoided
                            ? field.value.filter((item) => item !== ingredient)
                            : [...field.value, ingredient],
                        )
                      }
                    >
                      {t(`prefs.exclusions.${ingredient}`)}
                      {avoided && <X aria-hidden className="size-3.5" strokeWidth={2.4} />}
                    </Chip>
                  );
                })}
              </div>
            </Group>
          )}
        />

        {save.isError && <ErrorMessage message={t('onboarding.saveError')} />}
      </Screen>

      <BottomAction>
        <Button type="submit" block disabled={save.isPending}>
          {t('onboarding.start')}
        </Button>
        <p className="text-center text-12 text-muted">{t('onboarding.changeLater')}</p>
      </BottomAction>
    </form>
  );
}
