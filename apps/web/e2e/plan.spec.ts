import { seriousIssues } from './axe';
import { expect, prefix, test } from './fixtures';

// The browser clock is fixed so the demo plan lands on known days: planned on Thursday 15 October
// for Sunday 18 to Thursday 22, with the default 1:30 break (lunch arrives at 1:15).

test('a confirmed plan follows the week day by day', async ({
  page,
  t,
  path,
  appLocale,
}, testInfo) => {
  await page.clock.setFixedTime(new Date('2026-10-15T10:00:00'));
  await page.goto(path('/onboarding'));
  await page.getByRole('button', { name: t.onboarding.start }).click();
  await expect(page).toHaveURL(path('/chat'));

  await page.goto(path('/plan'));
  const confirm = page.getByRole('button', { name: new RegExp(prefix(t.plan.confirm)) });
  await confirm.click();
  const sheet = page.getByRole('dialog', { name: t.auth.gate.title });
  await sheet.getByLabel(t.auth.phoneLabel).fill('010 1234 5678');
  await sheet.getByRole('button', { name: t.auth.sendCode }).click();
  await page.getByLabel(t.auth.otp.label).fill('482193');
  await expect(page).toHaveURL(path('/plan'));
  await confirm.click();

  // Until the week starts, every day waits for its send time and can still be swapped.
  const swaps = page.getByRole('button', { name: t.plan.swap });
  await expect(swaps).toHaveCount(5);
  await expect(confirm).toBeHidden();

  // Tuesday 12:50: Sunday and Monday arrived, today's lunch is being prepared.
  await page.clock.setFixedTime(new Date('2026-10-20T12:50:00'));
  await page.reload();
  await expect(page.getByText(new RegExp(`^${prefix(t.plan.deliveredAt)} \\d`))).toHaveCount(2);
  await expect(page.getByText(t.tracking.steps.preparing)).toBeVisible();
  await expect(swaps).toHaveCount(2);
  expect(await seriousIssues(page)).toEqual([]);
  await testInfo.attach('current-plan', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await page.getByRole('link', { name: t.plan.track }).click();
  await expect(page).toHaveURL(new RegExp(`/${appLocale}/orders/PL-`));
  await expect(page.getByRole('heading', { name: t.tracking.title })).toBeVisible();
});
