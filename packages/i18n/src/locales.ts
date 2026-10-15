export const locales = ['ar', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar';

/** Text direction per locale. Set once on <html>, never inside components. */
export const directions: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
};

/** BCP 47 tags for Intl. Arabic keeps Latin digits (0-9), like most apps in Egypt. */
export const intlLocales: Record<Locale, string> = {
  ar: 'ar-EG-u-nu-latn',
  en: 'en-US',
};
