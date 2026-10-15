import type { Locale, Messages } from '@lo2ma/i18n';

// Teaches next-intl our locales and message keys, so t('chat.pikc') is a type error instead of a bug.
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
