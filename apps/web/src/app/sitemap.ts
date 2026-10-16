import { locales } from '@lo2ma/i18n/locales';
import type { MetadataRoute } from 'next';
import { languageAlternates, localizedPath } from '@/lib/seo/metadata';
import { absoluteUrl, publicPaths } from '@/lib/seo/site';

/**
 * Every public page in every language, each with its other languages (hreflang), the way Google wants a
 * multilingual site listed. No dates or priorities: Google ignores them unless they are exact.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.flatMap((path) => {
    const languages = Object.fromEntries(
      Object.entries(languageAlternates(path)).map(([tag, href]) => [tag, absoluteUrl(href)]),
    );
    return locales.map((locale) => ({
      url: absoluteUrl(localizedPath(locale, path)),
      alternates: { languages },
    }));
  });
}
