import { messages } from '@lo2ma/i18n';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import * as rootParams from 'next/root-params';
import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  const requested = locale ?? (await rootParams.locale());
  if (!hasLocale(routing.locales, requested)) notFound();

  return { locale: requested, messages: messages[requested] };
});
