import type { Locale } from '@lo2ma/i18n/locales';
import { getTranslations } from 'next-intl/server';
import type { SeoText } from './metadata';

/** The `seo` messages a page's metadata is built from, in one language. Server only. */
export async function seoText(locale: Locale): Promise<SeoText> {
  const t = await getTranslations({ locale });
  return {
    brand: t('common.brand'),
    title: t('seo.title'),
    description: t('seo.description'),
    imageAlt: t('seo.imageAlt'),
  };
}
