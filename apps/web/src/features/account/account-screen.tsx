'use client';

import { formatList, formatMoney, formatTime, maskEgyptMobile, type UserPrefs } from '@lo2ma/core';
import { locales } from '@lo2ma/i18n/locales';
import { ChevronRight, LogOut } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button, buttonVariants } from '@/components/ui/button';
import { Screen, ScreenHeader } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { focusRing } from '@/components/ui/focus';
import { useSession, useSignOut } from '@/features/auth/api';
import { WithLocationPicker } from '@/features/location/with-location-picker';
import { usePaymentMethods } from '@/features/orders/api';
import { usePrefs, useSavePrefs } from '@/features/prefs/api';
import { useCalorieLabel } from '@/features/prefs/options';
import { Link, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-label-md text-ink-2">{title}</h2>
      <Card className="divide-y divide-divider rounded-22 px-4">{children}</Card>
    </section>
  );
}

const prefRow = cn('flex h-13 w-full items-center gap-2.5 text-body-md', focusRing);

function PrefRowContent({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="flex-1 text-start font-medium">{label}</span>
      <bdi className="truncate text-body-sm text-muted">{value}</bdi>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted rtl:rotate-180" />
    </>
  );
}

/** A preference row that opens onboarding to change it. */
function PrefRow({ label, value }: { label: string; value: string }) {
  return (
    <Link href="/onboarding" className={prefRow}>
      <PrefRowContent label={label} value={value} />
    </Link>
  );
}

/** The workplace opens the map right here, and the new place is saved with the other preferences. */
function WorkplaceRow({ prefs }: { prefs: UserPrefs }) {
  const t = useTranslations('prefs');
  const locale = useLocale();
  const save = useSavePrefs();
  return (
    <WithLocationPicker
      value={prefs.workplace}
      onConfirm={(workplace) => save.mutate({ ...prefs, workplace })}
    >
      {(trigger) => (
        <button type="button" {...trigger} className={prefRow}>
          <PrefRowContent label={t('workplace')} value={prefs.workplace.name[locale]} />
        </button>
      )}
    </WithLocationPicker>
  );
}

function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-16 flex-wrap items-center justify-between gap-2.5 py-2">
      <span className="text-body-md font-medium">{label}</span>
      {children}
    </div>
  );
}

export function AccountScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const session = useSession();
  const prefs = usePrefs();
  const payment = usePaymentMethods();
  const signOut = useSignOut();
  const calorieLabel = useCalorieLabel();

  const user = session.data;
  const card = payment.data?.find((option) => option.method === 'card');
  const contact = user?.phone ? maskEgyptMobile(user.phone) : user?.email;

  return (
    <>
      <ScreenHeader title={t('account.title')} />
      <Screen clear="nav">
        {user ? (
          <Card className="flex items-center gap-3 p-3">
            <span
              aria-hidden
              className="flex size-13 shrink-0 items-center justify-center rounded-full bg-tint text-title-lg font-bold text-on-tint"
            >
              {(user.name || t('common.brand')).charAt(0)}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-title-md">{user.name || t('account.noName')}</span>
              {contact && (
                <bdi dir="ltr" className="text-start text-body-sm text-muted">
                  {contact}
                </bdi>
              )}
            </div>
            <Link href="/onboarding" className={buttonVariants({ variant: 'tonal', size: 'sm' })}>
              {t('common.edit')}
            </Link>
          </Card>
        ) : (
          <Card className="flex flex-col items-start gap-3 p-4">
            <p className="text-body-md text-ink-2">{t('account.guest')}</p>
            <Link href="/sign-in?next=/account" className={buttonVariants({ size: 'sm' })}>
              {t('common.signIn')}
            </Link>
          </Card>
        )}

        {prefs.data && (
          <Section title={t('account.lunchPrefs')}>
            <WorkplaceRow prefs={prefs.data} />
            <PrefRow label={t('prefs.breakTime')} value={formatTime(prefs.data.breakTime)} />
            <PrefRow label={t('prefs.budget')} value={formatMoney(prefs.data.budget, locale)} />
            <PrefRow label={t('prefs.calories')} value={calorieLabel(prefs.data.calories)} />
            <PrefRow
              label={t('prefs.avoid')}
              value={formatList(
                prefs.data.exclusions.map((ingredient) => t(`prefs.exclusions.${ingredient}`)),
                locale,
              )}
            />
          </Section>
        )}

        <Section title={t('account.paymentAndApp')}>
          {card && (
            <SettingRow label={t('account.paymentMethods')}>
              <span className="text-body-sm text-muted">
                {t('payment.card', { last4: card.last4 ?? '' })}
              </span>
            </SettingRow>
          )}
          <SettingRow label={t('account.language')}>
            <LanguageSwitcher
              label={t('account.language')}
              options={locales.map((option) => ({
                locale: option,
                label: t(`languages.${option}`),
              }))}
            />
          </SettingRow>
          <SettingRow label={t('account.appearance')}>
            <ThemeSwitcher
              label={t('account.appearance')}
              labels={{
                light: t('account.themes.light'),
                dark: t('account.themes.dark'),
                system: t('account.themes.system'),
              }}
            />
          </SettingRow>
        </Section>

        {user && (
          <Button
            variant="ghost"
            size="md"
            className="text-body-md text-ink-2"
            disabled={signOut.isPending}
            onClick={() => signOut.mutate(undefined, { onSuccess: () => router.replace('/') })}
          >
            <LogOut aria-hidden className="size-4.5 rtl:rotate-180" />
            {t('account.signOut')}
          </Button>
        )}
      </Screen>
    </>
  );
}
