import { messages, type Locale, type Messages } from '@lo2ma/i18n';
import { expect, test as base } from '@playwright/test';

export interface AppOptions {
  appLocale: Locale;
}

interface AppFixtures {
  /** The interface text in the project's language, so selectors read like the screen. */
  t: Messages;
  /** Prefixes a path with the project's locale: path('/chat') → '/ar/chat'. */
  path: (route: string) => string;
}

/** Statuses the API contract answers on purpose (a guest has no session or no preferences yet). */
const EXPECTED_ERROR = /^Failed to load resource: the server responded with a status of 4\d\d/;

export const test = base.extend<AppOptions & AppFixtures>({
  // Every journey fails on a browser error: an uncaught exception, a hydration mismatch or anything else React
  // reports as an error. They come from our code here, in a clean browser with no extensions.
  //
  // And no request leaves the test server: a test that quietly needs the internet fails here, every time, instead
  // of failing now and then when the network does. A test that needs an outside service stubs it with a route on
  // the context (registered later, so it runs first).
  page: async ({ page }, use) => {
    const external: string[] = [];
    await page.context().route(/^https?:\/\/(?!localhost[:/])/, (route) => {
      external.push(route.request().url());
      return route.abort();
    });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(`uncaught: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error' && !EXPECTED_ERROR.test(message.text()))
        errors.push(message.text());
    });
    await use(page);
    expect(external, 'requests that left the test server').toEqual([]);
    expect(errors, 'errors in the browser console').toEqual([]);
  },
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
