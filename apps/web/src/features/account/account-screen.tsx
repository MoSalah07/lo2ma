'use client';

import { formatList, formatMoney, formatTime, maskEgyptMobile } from '@lo2ma/core';
import { locales } from '@lo2ma/i18n';
import { ChevronRight, LogOut } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { focusRing } from '@/components/ui/focus';
import { useSession, useSignOut } from '@/features/auth/api';
import { usePaymentMethods } from '@/features/orders/api';
import { usePrefs } from '@/features/prefs/api';
import { useCalorieLabel } from '@/features/prefs/options';
import { Link, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-13 font-semibold text-ink-2">{title}</h2>
      <Card className="divide-y divide-divider rounded-22 px-4">{children}</Card>
    </section>
  );
}

/** A preference row that opens onboarding to change it. */
function PrefRow({ label, value }: { label: string; value: string }) {
  return (
    <Link href="/onboarding" className={cn('flex h-13 items-center gap-2.5 text-14', focusRing)}>
      <span className="flex-1 font-medium">{label}</span>
      <span className="truncate text-13 text-muted">{value}</span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted rtl:rotate-180" />
    </Link>
  );
}

function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-16 flex-wrap items-center justify-between gap-2.5 py-2">
      <span className="text-14 font-medium">{label}</span>
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
    <div className="flex flex-col gap-3.5 px-4 pt-5 pb-32">
      <h1 className="px-1 text-26 leading-heading font-extrabold">{t('account.title')}</h1>

      {user ? (
        <Card className="flex items-center gap-3 p-3">
          <span
            aria-hidden
            className="flex size-13 shrink-0 items-center justify-center rounded-full bg-tint text-20 font-bold text-on-tint"
          >
            {(user.name || t('common.brand')).charAt(0)}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-16 font-bold">{user.name || t('account.noName')}</span>
            {contact && (
              <bdi dir="ltr" className="text-start text-13 text-muted">
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
          <p className="text-14 leading-body text-ink-2">{t('account.guest')}</p>
          <Link href="/sign-in?next=/account" className={buttonVariants({ size: 'sm' })}>
            {t('common.signIn')}
          </Link>
        </Card>
      )}

      {prefs.data && (
        <Section title={t('account.lunchPrefs')}>
          <PrefRow label={t('prefs.workplace')} value={prefs.data.workplace.name[locale]} />
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
            <span className="text-13 text-muted">
              {t('payment.card', { last4: card.last4 ?? '' })}
            </span>
          </SettingRow>
        )}
        <SettingRow label={t('account.language')}>
          <LanguageSwitcher
            label={t('account.language')}
            options={locales.map((option) => ({ locale: option, label: t(`languages.${option}`) }))}
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
          className="text-14 text-ink-2"
          disabled={signOut.isPending}
          onClick={() => signOut.mutate(undefined, { onSuccess: () => router.replace('/') })}
        >
          <LogOut aria-hidden className="size-4.5 rtl:rotate-180" />
          {t('account.signOut')}
        </Button>
      )}
    </div>
  );
}
