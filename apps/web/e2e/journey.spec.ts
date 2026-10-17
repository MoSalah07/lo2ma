import { expect, prefix, test } from './fixtures';

// The main journey from the plan: set preferences, ask in the chat, pick a meal as a guest,
// sign in at checkout, pay in the sandbox and follow the order.

const request = { ar: 'معايا 200 جنيه، ومش عايز فراخ', en: 'I have EGP 200, no chicken please' };

test('a guest sets up lunch, signs in at checkout, pays and tracks the order', async ({
  page,
  t,
  path,
  appLocale,
}, testInfo) => {
  const snap = async (name: string) =>
    testInfo.attach(name, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

  await page.goto(path('/onboarding'));
  await expect(page.getByRole('heading', { name: t.onboarding.title })).toBeVisible();
  await snap('1-onboarding');
  await page.getByRole('button', { name: t.onboarding.start }).click();

  await expect(page).toHaveURL(path('/chat'));
  await page.getByLabel(t.chat.inputLabel).fill(request[appLocale]);
  await page.getByRole('button', { name: t.common.send }).click();
  const pick = page.getByRole('button', { name: t.chat.pick });
  await expect(pick).toBeVisible({ timeout: 15_000 });
  await snap('2-chat');

  await pick.click();
  const sheet = page.getByRole('dialog', { name: t.auth.gate.title });
  await expect(sheet).toBeVisible();
  await snap('3-sign-in-sheet');
  await sheet.getByLabel(t.auth.phoneLabel).fill('010 1234 5678');
  await sheet.getByRole('button', { name: t.auth.sendCode }).click();

  await expect(page.getByRole('heading', { name: t.auth.otp.title })).toBeVisible();
  await page.getByLabel(t.auth.otp.label).fill('482193');

  await expect(page).toHaveURL(new RegExp(`/${appLocale}/checkout/`));
  await expect(page.getByRole('heading', { name: t.checkout.title })).toBeVisible();
  await snap('4-checkout');
  await page.getByRole('button', { name: new RegExp(prefix(t.checkout.confirmAmount)) }).click();
  // A short celebration, then the order's page.
  await expect(page.getByRole('heading', { name: t.success.order })).toBeFocused();

  // The celebration holds for 1.6 s on purpose, and its 3D is drawn in software in headless Chrome, so with the
  // other journeys running alongside, the move to the order can take longer than the default 5 s.
  await expect(page).toHaveURL(new RegExp(`/${appLocale}/orders/LQ-`), { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: t.tracking.title })).toBeVisible();
  await expect(page.getByText(t.tracking.steps.sent)).toBeVisible();
  await snap('5-tracking');
});

test('the weekly plan offers five days and swaps one', async ({ page, t, path }, testInfo) => {
  await page.goto(path('/onboarding'));
  await page.getByRole('button', { name: t.onboarding.start }).click();
  await expect(page).toHaveURL(path('/chat'));

  await page.goto(path('/plan'));
  const swaps = page.getByRole('button', { name: t.plan.swap });
  await expect(swaps).toHaveCount(5);
  await testInfo.attach('6-plan', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  await swaps.first().click();
  await expect(swaps).toHaveCount(5);
});

test('every page sets the language and direction once, on <html>', async ({
  page,
  path,
  appLocale,
}) => {
  await page.goto(path('/chat'));
  await expect(page.locator('html')).toHaveAttribute('lang', appLocale);
  await expect(page.locator('html')).toHaveAttribute('dir', appLocale === 'ar' ? 'rtl' : 'ltr');
});
