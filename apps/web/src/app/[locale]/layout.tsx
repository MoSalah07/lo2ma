import { directions } from '@lo2ma/i18n';
import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { QueryProvider } from '@/components/query-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { routing } from '@/i18n/routing';
import { alexandria } from '../fonts';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  return {
    title: { default: t('brand'), template: `%s · ${t('brand')}` },
    description: t('tagline'),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    // next-themes adds the theme class to <html> before React hydrates, so React must not warn about it.
    <html
      lang={locale}
      dir={directions[locale]}
      className={alexandria.variable}
      suppressHydrationWarning
    >
      <body>
        {/* Messages stay on the server. A client island that needs text gets its own subset. */}
        <NextIntlClientProvider messages={null}>
          <ThemeProvider>
            <QueryProvider>{children}</QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
