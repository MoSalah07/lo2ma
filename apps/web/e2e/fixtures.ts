import { messages, type Locale, type Messages } from '@lo2ma/i18n';
import { test as base } from '@playwright/test';

export interface AppOptions {
  appLocale: Locale;
}

interface AppFixtures {
  /** The interface text in the project's language, so selectors read like the screen. */
  t: Messages;
  /** Prefixes a path with the project's locale: path('/chat') → '/ar/chat'. */
  path: (route: string) => string;
}

export const test = base.extend<AppOptions & AppFixtures>({
  appLocale: ['ar', { option: true }],
  t: async ({ appLocale }, use) => {
    await use(messages[appLocale]);
  },
  path: async ({ appLocale }, use) => {
    await use((route) => `/${appLocale}${route}`);
  },
});

export { expect } from '@playwright/test';

/** Replaces {placeholders} the way the app does, for matching text that has values in it. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/** The visible text of a message up to its first placeholder, for "starts with" matches. */
export const prefix = (template: string) => template.split('{')[0]?.trim() ?? template;
