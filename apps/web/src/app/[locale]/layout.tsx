import { colors } from '@lo2ma/tokens';
import type { Metadata, Viewport } from 'next';
import { hasLocale } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AppDocument } from '@/components/app-document';
import { routing } from '@/i18n/routing';
import { siteMetadata } from '@/lib/seo/metadata';
import { seoText } from '@/lib/seo/text';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** What every page says unless it says otherwise; a page search engines should list says so itself. */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return siteMetadata(locale, await seoText(locale));
}

/** The browser's own bars (the address bar on Android) take the page's color, in the device's theme. */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: colors.light.bg },
    { media: '(prefers-color-scheme: dark)', color: colors.dark.bg },
  ],
};

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return <AppDocument locale={locale}>{children}</AppDocument>;
}
