import { messages } from '@lo2ma/i18n';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import * as rootParams from 'next/root-params';
import { routing } from './routing';

export default getRequestConfig(async ({ locale, requestLocale }) => {
  // An explicit locale first, then the [locale] segment, then the one the proxy read from the URL: the 404 for
  // unknown URLs renders outside the segment. The [locale] layout is what rejects an unknown locale.
  const requested = locale ?? (await rootParams.locale()) ?? (await requestLocale);
  const resolved = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale: resolved, messages: messages[resolved] };
});
