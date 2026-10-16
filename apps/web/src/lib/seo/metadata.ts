import { defaultLocale, locales, regionTags, type Locale } from '@lo2ma/i18n/locales';
import type { Metadata } from 'next';
import { indexable, siteUrl, verification, type publicPaths } from './site';

/** A path search engines list. Only these can be given `publicPageMetadata`, and the sitemap lists exactly them. */
export type PublicPath = (typeof publicPaths)[number];

/** The words a page's metadata needs, from the `seo` messages (see `seoText`). */
export interface SeoText {
  brand: string;
  title: string;
  description: string;
  imageAlt: string;
}

/** A page's address in a language: '/ar', '/en/plan'. */
export const localizedPath = (locale: Locale, path = '') => `/${locale}${path}`;

/**
 * The same page in every language, by language and region (hreflang), and x-default for everyone else: Arabic,
 * where `/` leads.
 */
export function languageAlternates(path = ''): Record<string, string> {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [regionTags[locale], localizedPath(locale, path)]),
    ),
    'x-default': localizedPath(defaultLocale, path),
  };
}

/** The picture link previews show, made by `npm run images`. 1200×630 is the size every platform crops alike. */
export const shareImage = {
  width: 1200,
  height: 630,
  path: (locale: Locale) => `/og/${locale}.jpg`,
};

const ogLocale = (locale: Locale) => regionTags[locale].replace('-', '_');

/**
 * The link preview on WhatsApp, Facebook, LinkedIn and X. Next replaces these two objects whole when a page sets
 * them, so they are always built in full here.
 */
function previews(
  locale: Locale,
  text: SeoText,
  path?: string,
): Pick<Metadata, 'openGraph' | 'twitter'> {
  const images = [
    {
      url: shareImage.path(locale),
      width: shareImage.width,
      height: shareImage.height,
      alt: text.imageAlt,
    },
  ];
  return {
    openGraph: {
      type: 'website',
      siteName: text.brand,
      title: text.title,
      description: text.description,
      locale: ogLocale(locale),
      alternateLocale: locales.filter((other) => other !== locale).map(ogLocale),
      ...(path !== undefined && { url: localizedPath(locale, path) }),
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: text.title,
      description: text.description,
      images,
    },
  };
}

/**
 * What every page says unless it says otherwise: where relative links resolve, the title pattern, the link
 * preview, and noindex. Most screens are the app itself, so search engines list only the pages that ask for it.
 */
export function siteMetadata(locale: Locale, text: SeoText): Metadata {
  return {
    metadataBase: siteUrl,
    applicationName: text.brand,
    title: { default: text.title, template: `%s · ${text.brand}` },
    description: text.description,
    robots: { index: false, follow: true },
    formatDetection: { telephone: false, email: false, address: false },
    verification,
    ...previews(locale, text),
  };
}

/** A page search engines list: its canonical address, the same page in the other language, and its preview. */
export function publicPageMetadata(locale: Locale, path: PublicPath, text: SeoText): Metadata {
  return {
    title: { absolute: text.title },
    description: text.description,
    alternates: { canonical: localizedPath(locale, path), languages: languageAlternates(path) },
    robots: indexable
      ? {
          index: true,
          follow: true,
          // Let Google show the large preview image and a full snippet, as news and shop sites do.
          googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
        }
      : { index: false, follow: false },
    ...previews(locale, text, path),
  };
}
