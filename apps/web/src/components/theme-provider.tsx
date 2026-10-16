'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * The theme script runs once, from the server's HTML, before the first paint. If React ever builds the page again
 * in the browser (after a hydration mismatch, which extensions that inject elements cause), it would create a
 * copy that can never run and warn about it. So in the browser the copy is marked as data, which React leaves
 * alone. The type differs from the server's on purpose: next-themes suppresses hydration warnings on its script.
 */
const scriptProps = {
  type: typeof window === 'undefined' ? 'text/javascript' : 'application/json',
};

/**
 * Puts `class="dark"` on <html> before the first paint (no white flash), follows the system by default and
 * remembers the user's choice. The `.dark` selector is where @lo2ma/tokens switches every color.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      scriptProps={scriptProps}
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
