import { messages, type Messages } from '@lo2ma/i18n';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

interface ClientMessagesProps {
  /** Only these namespaces are sent to the browser. */
  namespaces: (keyof Messages)[];
  children: ReactNode;
}

/**
 * Gives a client island the messages it needs and nothing more, so each page ships only its own text.
 */
export async function ClientMessages({ namespaces, children }: ClientMessagesProps) {
  const locale = await getLocale();
  const subset = Object.fromEntries(namespaces.map((name) => [name, messages[locale][name]]));
  return <NextIntlClientProvider messages={subset}>{children}</NextIntlClientProvider>;
}
