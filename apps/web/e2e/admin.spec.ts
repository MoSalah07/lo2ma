import type { Messages } from '@lo2ma/i18n';
import type { Page, TestInfo } from '@playwright/test';
import { seriousIssues } from './axe';
import { expect, test } from './fixtures';

// The admin dashboard is built for desktop screens.
test.use({ viewport: { width: 1440, height: 1000 }, isMobile: false, hasTouch: false });

async function snap(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}

/** Password, then the authenticator code (any 6 digits but 000000 in the demo). */
async function signIn(page: Page, t: Messages, code = '482193') {
  await page.getByLabel(t.admin.signIn.email).fill('admin@lo2ma.test');
  await page.getByLabel(t.admin.signIn.password, { exact: true }).fill('correct horse');
  await page.getByRole('button', { name: t.admin.signIn.submit, exact: true }).click();
  await page.getByLabel(t.admin.signIn.codeLabel).fill(code);
}

async function openAs(page: Page, t: Messages, path: (route: string) => string, route: string) {
  await page.goto(path(route));
  await expect(page).toHaveURL(new RegExp('/admin/sign-in'));
  await signIn(page, t);
  await expect(page).toHaveURL(path(route));
}

test('an admin signs in with a password and a code, and lands where they were going', async ({
  page,
  t,
  path,
}, testInfo) => {
  await page.goto(path('/admin/orders'));
  await expect(page).toHaveURL(new RegExp('/admin/sign-in\\?next=%2Fadmin%2Forders'));
  await snap(page, testInfo, 'admin-sign-in');

  await page.getByLabel(t.admin.signIn.email).fill('admin@lo2ma.test');
  await page.getByLabel(t.admin.signIn.password, { exact: true }).fill('short');
  await page.getByRole('button', { name: t.admin.signIn.submit, exact: true }).click();
  await expect(page.getByText(t.admin.signIn.invalid)).toBeVisible();

  await signIn(page, t, '000000');
  await expect(page.getByText(t.admin.signIn.invalidCode)).toBeVisible();
  await page.getByLabel(t.admin.signIn.codeLabel).fill('482193');

  await expect(page).toHaveURL(path('/admin/orders'));
  await expect(page.getByRole('heading', { name: t.admin.orders.title, level: 1 })).toBeVisible();
});

test('the overview shows the numbers, the charts and the latest orders', async ({
  page,
  t,
  path,
}, testInfo) => {
  await openAs(page, t, path, '/admin');
  await expect(page.getByRole('heading', { name: t.admin.overview.title, level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: t.admin.overview.chartTitle })).toBeVisible();
  await expect(
    page.getByRole('table', { name: t.admin.overview.recent }).getByRole('row'),
  ).toHaveCount(6);
  await snap(page, testInfo, 'admin-overview');

  await page.getByRole('button', { name: t.admin.overview.ranges.week }).click();
  await expect(page.getByRole('button', { name: t.admin.overview.ranges.week })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await seriousIssues(page)).toEqual([]);
});

test('orders filter by status and page through the month', async ({ page, t, path }, testInfo) => {
  await openAs(page, t, path, '/admin/orders');
  const table = page.getByRole('table', { name: t.admin.orders.title });
  await expect(table.getByRole('row')).toHaveCount(11);

  await page
    .getByRole('group', { name: t.admin.orders.statusFilter })
    .getByRole('button', { name: new RegExp(`^${t.admin.status.late}`) })
    .click();
  await expect(page).toHaveURL(/status=late/);
  await expect(table.getByText(t.admin.status.late)).toHaveCount(10);

  await page.getByRole('button', { name: t.admin.orders.next }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(
    page.getByRole('navigation', { name: t.admin.orders.pages }).locator('[aria-current="page"]'),
  ).toHaveText('2');
  await snap(page, testInfo, 'admin-orders');
  expect(await seriousIssues(page)).toEqual([]);
});

test('a coupon cannot go under the minimum order, and a valid one is saved', async ({
  page,
  t,
  path,
}, testInfo) => {
  await openAs(page, t, path, '/admin/coupons');
  await page.getByLabel(t.admin.coupons.code, { exact: true }).fill('lunch15');
  await page.getByLabel(t.admin.coupons.value).fill('15');
  await page.getByLabel(t.admin.coupons.cap).fill('30');
  await page.getByLabel(t.admin.coupons.minOrder).fill('99');
  await page.getByLabel(t.admin.coupons.endsOn).fill('2099-11-30');
  await page.getByRole('button', { name: t.admin.coupons.save }).click();
  await expect(page.getByLabel(t.admin.coupons.minOrder)).toHaveAttribute('aria-invalid', 'true');

  await page.getByLabel(t.admin.coupons.minOrder).fill('100');
  await page.getByRole('button', { name: t.admin.coupons.save }).click();
  await expect(page.getByRole('status').filter({ hasText: 'LUNCH15' })).toBeVisible();
  await expect(page.getByLabel(t.admin.coupons.code, { exact: true })).toHaveValue('');
  await expect(
    page.getByRole('table', { name: t.admin.coupons.title }).getByText('LUNCH15'),
  ).toBeVisible();
  await snap(page, testInfo, 'admin-coupons');
  expect(await seriousIssues(page)).toEqual([]);
});

test('the agent log shows each step and that the customer confirmed, not the agent', async ({
  page,
  t,
  path,
}, testInfo) => {
  await openAs(page, t, path, '/admin/agent');
  await expect(page.getByText(t.admin.agent.safety)).toBeVisible();
  await snap(page, testInfo, 'admin-agent');

  await page
    .getByRole('group', { name: t.admin.agent.filter })
    .getByRole('button', { name: t.admin.agent.filters.issues })
    .click();
  await expect(page.getByText(t.admin.agent.outcomes.noResults).first()).toBeVisible();
  expect(await seriousIssues(page)).toEqual([]);
});
