import { directions, type Locale } from '@lo2ma/i18n/locales';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { alexandria } from '@/app/fonts';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import '@/app/globals.css';

interface AppDocumentProps {
  locale: Locale;
  children: ReactNode;
}

/**
 * The HTML document around every page: the language and direction (set once, here), the font, and the
 * app-wide providers. The locale layout uses it, and so does the 404 for URLs that match no page.
 */
export function AppDocument({ locale, children }: AppDocumentProps) {
  return (
    // next-themes adds the theme class to <html> before React hydrates, so React must not warn about it.
    <html
      lang={locale}
      dir={directions[locale]}
      className={alexandria.variable}
      suppressHydrationWarning
    >
      <body>
        {/* Messages stay on the server. A client island that needs text gets its own subset. */}
        <NextIntlClientProvider locale={locale} messages={null}>
          <ThemeProvider>
            <QueryProvider>{children}</QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
