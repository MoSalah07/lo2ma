import { locales } from '@lo2ma/i18n';
import { expect, test } from './fixtures';

test('the landing page leads to onboarding', async ({ page, t, path }) => {
  await page.goto(path(''));
  await expect(page.getByRole('heading', { level: 1, name: t.landing.title })).toBeVisible();

  // One action, at the top and again at the bottom.
  const start = page.getByRole('link', { name: t.onboarding.start });
  await expect(start).toHaveCount(2);

  await start.first().click();
  await expect(page).toHaveURL(path('/onboarding'));
});

test('the landing page links to the other language', async ({ page, t, path, appLocale }) => {
  const other = locales.find((locale) => locale !== appLocale) ?? appLocale;
  await page.goto(path(''));

  await page.getByRole('link', { name: t.languages[other] }).click();

  await expect(page).toHaveURL(`/${other}`);
  await expect(page.locator('html')).toHaveAttribute('lang', other);
});
