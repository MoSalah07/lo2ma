// The README screenshots, taken from the production build (run `npm run build` first): the main screens in Arabic
// and English, light and dark, on a phone and on a desktop. They go to docs/screenshots/ at the repo root.
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from '@playwright/test';

const out = fileURLToPath(new URL('../../../docs/screenshots/', import.meta.url));
const messages = (locale) =>
  JSON.parse(
    readFileSync(
      new URL(`../../../packages/i18n/messages/${locale}.json`, import.meta.url),
      'utf8',
    ),
  );
const phone = { ...devices['Pixel 7'], deviceScaleFactor: 2 };
const desktop = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const request = { ar: 'معايا 200 جنيه، ومش عايز فراخ', en: 'I have EGP 200, no chicken please' };
const visible = (locator, timeout = 20_000) =>
  locator.first().waitFor({ state: 'visible', timeout });

const freePort = () =>
  new Promise((resolve) => {
    const server = createServer().listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

const port = await freePort();
const base = `http://localhost:${port}`;
const next = spawn(
  process.execPath,
  ['../../node_modules/next/dist/bin/next', 'start', '-p', String(port)],
  { env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: 'ignore' },
);

/** One browser session: a phone or a desktop, in a language and a theme. `snap` saves the screen as it is. */
async function session(browser, { locale, scheme, device }, steps) {
  const context = await browser.newContext({
    ...device,
    colorScheme: scheme,
    permissions: ['microphone'],
  });
  const page = await context.newPage();
  const snap = async (name) => {
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}${name}.jpg`, type: 'jpeg', quality: 85 });
    console.log(`✓ ${name}`);
  };
  try {
    await steps({ page, t: messages(locale), path: (route) => `${base}/${locale}${route}`, snap });
  } finally {
    await context.close();
  }
}

/** Onboarding with the defaults, which every app screen needs first. */
async function onboard({ page, t, path }) {
  await page.goto(path('/onboarding'));
  await page.getByRole('button', { name: t.onboarding.start }).click();
  await page.waitForURL(path('/chat'));
}

/** The guest sign-in sheet, with any phone number and any code but 000000. */
async function signIn({ page, t }) {
  const sheet = page.getByRole('dialog', { name: t.auth.gate.title });
  await sheet.getByLabel(t.auth.phoneLabel).fill('010 1234 5678');
  await sheet.getByRole('button', { name: t.auth.sendCode }).click();
  await page.getByLabel(t.auth.otp.label).fill('482193');
}

let browser;
try {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch(`${base}/ar`)).ok) break;
    } catch {
      // Not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  mkdirSync(out, { recursive: true });
  browser = await chromium.launch({
    channel: 'chrome',
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });

  await session(
    browser,
    { locale: 'ar', scheme: 'light', device: desktop },
    async ({ page, path, snap }) => {
      await page.goto(path(''));
      // The hero's 3D starts on the first interaction, then its models load and rise in.
      await page.mouse.move(900, 400);
      await page.waitForTimeout(6_000);
      await snap('landing-ar');
    },
  );

  await session(browser, { locale: 'ar', scheme: 'light', device: phone }, async (s) => {
    const { page, t, snap } = s;
    await onboard(s);
    await page.getByLabel(t.chat.inputLabel).fill(request.ar);
    await page.getByRole('button', { name: t.common.send }).click();
    const pick = page.getByRole('button', { name: t.chat.pick });
    await visible(pick);
    await snap('chat-ar');

    await pick.first().click();
    await signIn(s);
    await visible(page.getByRole('heading', { name: t.checkout.title }));
    await snap('checkout-ar');

    await page
      .getByRole('button', { name: new RegExp(t.checkout.confirmAmount.split('{')[0].trim()) })
      .click();
    await visible(page.getByRole('heading', { name: t.tracking.title }));
    // One step along the timeline: the restaurant accepted.
    await page.waitForTimeout(9_000);
    await snap('tracking-ar');
  });

  await session(browser, { locale: 'en', scheme: 'light', device: phone }, async (s) => {
    await onboard(s);
    await s.page.goto(s.path('/plan'));
    await visible(s.page.getByRole('button', { name: s.t.plan.swap }));
    await s.snap('plan-en');
  });

  await session(browser, { locale: 'ar', scheme: 'dark', device: phone }, async (s) => {
    const { page, t, path, snap } = s;
    // Planned on Thursday for the next week, then seen on Tuesday at 12:50, like the e2e test.
    await page.clock.setFixedTime(new Date('2026-10-15T10:00:00'));
    await onboard(s);
    await page.goto(path('/plan'));
    const confirm = page.getByRole('button', {
      name: new RegExp(t.plan.confirm.split('{')[0].trim()),
    });
    await confirm.click();
    await signIn(s);
    await page.waitForURL(path('/plan'));
    await confirm.click();
    await visible(page.getByRole('heading', { name: t.success.plan }));
    await page.clock.setFixedTime(new Date('2026-10-20T12:50:00'));
    await page.reload();
    await visible(page.getByText(t.tracking.steps.preparing));
    await snap('current-plan-ar-dark');
  });

  await session(browser, { locale: 'ar', scheme: 'dark', device: phone }, async (s) => {
    const { page, t, snap } = s;
    await onboard(s);
    await page.getByRole('link', { name: t.chat.voice.call }).click();
    const done = page.getByRole('button', { name: t.voiceMode.done });
    await visible(done);
    await page.waitForTimeout(1_500);
    // Chrome's fake microphone never pauses, so the turn ends on the orb.
    await done.click({ timeout: 1_000 }).catch(() => undefined);
    await visible(page.getByRole('button', { name: t.chat.pick }));
    await snap('voice-ar-dark');
  });

  await session(
    browser,
    { locale: 'en', scheme: 'dark', device: desktop },
    async ({ page, t, path, snap }) => {
      await page.goto(path('/admin'));
      await page.getByLabel(t.admin.signIn.email).fill('admin@lo2ma.test');
      await page.getByLabel(t.admin.signIn.password, { exact: true }).fill('correct horse');
      await page.getByRole('button', { name: t.admin.signIn.submit, exact: true }).click();
      await page.getByLabel(t.admin.signIn.codeLabel).fill('482193');
      await visible(page.getByRole('heading', { level: 1 }));
      await page.waitForTimeout(1_500);
      await snap('admin-en-dark');
    },
  );
} finally {
  await browser?.close();
  next.kill();
}
