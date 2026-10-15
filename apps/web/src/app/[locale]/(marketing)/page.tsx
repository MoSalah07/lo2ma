import { formatMoney, MIN_ORDER } from '@lo2ma/core';
import { locales } from '@lo2ma/i18n';
import { useLocale, useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

// Temporary home page until the landing page is designed (task 24).
export default function HomePage() {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-5">
      <div className="flex flex-wrap gap-2">
        <LanguageSwitcher
          label={t('account.language')}
          options={locales.map((option) => ({ locale: option, label: t(`languages.${option}`) }))}
        />
        <ThemeSwitcher
          label={t('account.appearance')}
          labels={{
            light: t('account.themes.light'),
            dark: t('account.themes.dark'),
            system: t('account.themes.system'),
          }}
        />
      </div>
      <h1 className="text-44 leading-heading font-extrabold">{t('common.brand')}</h1>
      <p className="text-17 text-ink-2">{t('common.tagline')}</p>
      <p className="rounded-26 bg-surface p-4 text-15 shadow-card">
        {t('onboarding.minOrder', { amount: formatMoney(MIN_ORDER, locale) })}
      </p>
      <Link href="/onboarding" className={buttonVariants({ block: true })}>
        {t('onboarding.start')}
      </Link>
      <Link
        href="/sign-in"
        className={buttonVariants({ variant: 'outline', size: 'md', block: true })}
      >
        {t('common.signIn')}
      </Link>
    </main>
  );
}
