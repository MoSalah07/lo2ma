import { seriousIssues } from './axe';
import { expect, test } from './fixtures';

// axe checks each screen for accessibility problems: missing labels, bad roles, low contrast and more.
// Serious and critical issues fail the test. The admin screens are scanned in admin.spec.ts, after sign-in.

const screens = [
  '/',
  '/onboarding',
  '/chat',
  '/plan',
  '/orders',
  '/account',
  '/sign-in',
  '/admin/sign-in',
];

for (const screen of screens) {
  test(`${screen} has no serious accessibility issues`, async ({ page, path }) => {
    await page.goto(path(screen === '/' ? '' : screen));
    await page.waitForLoadState('networkidle');
    expect(await seriousIssues(page)).toEqual([]);
  });
}
