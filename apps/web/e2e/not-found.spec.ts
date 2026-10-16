import { seriousIssues } from './axe';
import { expect, test } from './fixtures';

test('a page that does not exist explains itself and leads home', async ({ page, t, path }) => {
  const response = await page.goto(path('/no-such-page'));
  expect(response?.status()).toBe(404);

  await expect(page.getByRole('heading', { level: 1, name: t.common.notFound })).toBeVisible();
  expect(await seriousIssues(page)).toEqual([]);

  await page.getByRole('link', { name: t.common.backHome }).click();
  await expect(page.getByRole('heading', { level: 1, name: t.landing.title })).toBeVisible();
});
