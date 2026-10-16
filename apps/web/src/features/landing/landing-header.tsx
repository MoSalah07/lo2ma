import { locales } from '@lo2ma/i18n';
import { useLocale, useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import { focusRing } from '@/components/ui/focus';
import { Wordmark } from '@/components/wordmark';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { landingColumn } from './section';

export function LandingHeader() {
  const t = useTranslations();
  const locale = useLocale();
  const other = locales.find((option) => option !== locale) ?? locale;

  return (
    <header
      className={cn(landingColumn, 'flex flex-wrap items-center justify-between gap-3 py-gutter')}
    >
      <Link href="/" className={cn('inline-flex h-11 items-center rounded-12', focusRing)}>
        <Wordmark name={t('common.brand')} />
      </Link>
      <nav aria-label={t('nav.label')} className="flex flex-wrap items-center gap-2">
        <ThemeToggle labels={{ dark: t('common.darkMode'), light: t('common.lightMode') }} />
        <Link
          href="/"
          locale={other}
          lang={other}
          hrefLang={other}
          className={cn(
            'inline-flex h-11 items-center rounded-full px-3.5 text-14 font-medium text-ink-2 transition-colors hover:text-ink',
            focusRing,
          )}
        >
          {t(`languages.${other}`)}
        </Link>
        <Link
          href="/sign-in"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'px-4.5 text-14')}
        >
          {t('common.signIn')}
        </Link>
      </nav>
    </header>
  );
}
