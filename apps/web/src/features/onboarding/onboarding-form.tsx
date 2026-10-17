'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  BREAK_TIMES,
  BUDGET_STEP,
  formatCalories,
  formatGrams,
  formatMoney,
  formatTime,
  userPrefsSchema,
  workplaceAt,
  type UserPrefs,
} from '@lo2ma/core';
import { ChevronRight, Dumbbell, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Screen } from '@/components/screen';
import { BottomAction } from '@/components/bottom-action';
import { Stepper } from '@/components/stepper';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { focusRing } from '@/components/ui/focus';
import { OptionGroup } from '@/components/ui/option-group';
import { WithFitGoal } from '@/features/fit/with-fit-goal';
import { useSuggestedPlaces } from '@/features/location/api';
import { usePrefs, useSavePrefs } from '@/features/prefs/api';
import {
  budgetLimits,
  calorieOptions,
  defaultPrefs,
  ingredients,
  sameCalories,
  useCalorieLabel,
} from '@/features/prefs/options';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { WorkplaceField } from './workplace-field';

/** The title and its line. They show at once, before the saved preferences arrive. */
function OnboardingIntro() {
  const t = useTranslations('onboarding');
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-headline-sm">{t('title')}</h1>
      <p className="text-body-md text-muted">{t('subtitle')}</p>
    </div>
  );
}

/** Loads the saved preferences (or sensible defaults) and only then shows the form's fields. */
export function OnboardingForm() {
  const prefs = usePrefs();
  const suggested = useSuggestedPlaces();

  if (prefs.isPending || suggested.isPending) {
    return (
      <Screen clear="action" className="pt-2">
        <OnboardingIntro />
        <LoadingBlocks count={4} />
      </Screen>
    );
  }
  // A new user starts at the most popular workplace and moves the pin from there.
  const popular = suggested.data?.[0];
  const initial =
    prefs.data ?? (popular ? defaultPrefs(workplaceAt(popular, popular.point)) : undefined);
  if (!initial) return <ErrorMessage onRetry={() => void suggested.refetch()} />;

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
          <span id={workplaceLabelId} className="text-label-md text-ink-2">
            {t('prefs.workplace')}
          </span>
          <Controller
            control={form.control}
            name="workplace"
            render={({ field }) => (
              <WorkplaceField
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
            <OptionGroup legend={t('prefs.breakTime')}>
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
            </OptionGroup>
          )}
        />

        <Controller
          control={form.control}
          name="budget"
          render={({ field }) => (
            <OptionGroup
              legend={t('prefs.budget')}
              aside={t('onboarding.minOrder', { amount: formatMoney(budgetLimits.min, locale) })}
            >
              <Stepper
                value={field.value}
                onChange={field.onChange}
                min={budgetLimits.min}
                max={budgetLimits.max}
                step={BUDGET_STEP}
                format={(value) => formatMoney(value, locale)}
                decreaseLabel={t('onboarding.decreaseBudget')}
                increaseLabel={t('onboarding.increaseBudget')}
              />
            </OptionGroup>
          )}
        />

        <Controller
          control={form.control}
          name="calories"
          render={({ field }) => (
            <OptionGroup legend={t('prefs.calories')}>
              <WithFitGoal value={field.value} onConfirm={field.onChange}>
                {(trigger) => (
                  <>
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
                      <Chip {...trigger} pressed={field.value.mode === 'fit'}>
                        <Dumbbell aria-hidden className="size-4" />
                        {t('fit.title')}
                      </Chip>
                    </div>
                    {field.value.mode === 'fit' && (
                      <button
                        type="button"
                        {...trigger}
                        className={cn(
                          'flex min-h-13 items-center gap-2.5 rounded-control bg-tint px-3.5 text-on-tint',
                          focusRing,
                        )}
                      >
                        <span className="flex-1 text-start text-label-lg">
                          {t('fit.summary', {
                            calories: formatCalories(field.value.kcal, locale),
                            protein: formatGrams(field.value.protein, locale),
                          })}
                        </span>
                        <span className="text-label-md">{t('fit.change')}</span>
                        <ChevronRight aria-hidden className="size-4 shrink-0 rtl:rotate-180" />
                      </button>
                    )}
                  </>
                )}
              </WithFitGoal>
            </OptionGroup>
          )}
        />

        <Controller
          control={form.control}
          name="exclusions"
          render={({ field }) => (
            <OptionGroup legend={t('onboarding.avoidQuestion')}>
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
            </OptionGroup>
          )}
        />

        {save.isError && <ErrorMessage message={t('onboarding.saveError')} />}
      </Screen>

      <BottomAction>
        <Button type="submit" block disabled={save.isPending}>
          {t('onboarding.start')}
        </Button>
        <p className="text-center text-caption text-muted">{t('onboarding.changeLater')}</p>
      </BottomAction>
    </form>
  );
}
