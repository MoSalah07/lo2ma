import { defaultLocale, locales } from '@lo2ma/i18n/locales';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Arabic is the default for everyone (the market is Egypt), so the browser language is not used to redirect.
  localeDetection: false,
});
