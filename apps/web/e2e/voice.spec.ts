import { seriousIssues } from './axe';
import { expect, test } from './fixtures';

// Recording uses Chrome's fake microphone (see playwright.config.ts). The demo writes down the same
// sentence for any recording.

test('dictation writes the words into the box, and nothing is sent until the user sends it', async ({
  page,
  t,
  path,
}) => {
  await page.goto(path('/onboarding'));
  await page.getByRole('button', { name: t.onboarding.start }).click();
  await expect(page).toHaveURL(path('/chat'));

  await page.getByRole('button', { name: t.chat.voice.start }).click();
  await expect(page.getByText(t.chat.voice.listening)).toBeVisible();
  expect(await seriousIssues(page)).toEqual([]);
  // Longer than the one-second minimum.
  await page.waitForTimeout(1_500);
  await page.getByRole('button', { name: t.chat.voice.stop }).click();

  await expect(page.getByLabel(t.chat.inputLabel)).not.toHaveValue('');
  await expect(page.getByText(t.chat.voice.review)).toBeVisible();
  await expect(page.getByRole('button', { name: t.chat.pick })).toHaveCount(0);

  await page.getByRole('button', { name: t.common.send }).click();
  await expect(page.getByRole('button', { name: t.chat.pick })).toBeVisible({ timeout: 15_000 });
});

test('a call answers on screen, and the conversation carries over to the chat', async ({
  page,
  t,
  path,
}) => {
  await page.goto(path('/onboarding'));
  await page.getByRole('button', { name: t.onboarding.start }).click();
  await expect(page).toHaveURL(path('/chat'));

  await page.getByRole('link', { name: t.chat.voice.call }).click();
  await expect(page).toHaveURL(path('/voice'));
  const done = page.getByRole('button', { name: t.voiceMode.done });
  await expect(done).toBeVisible();
  expect(await seriousIssues(page)).toEqual([]);
  await page.waitForTimeout(1_500);
  // The pause detector may have ended the turn already; if not, the user ends it on the orb.
  await done.click({ timeout: 1_000 }).catch(() => undefined);

  // The meal comes with a button: picking and paying are never done by voice.
  await expect(page.getByRole('button', { name: t.chat.pick })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('link', { name: t.voiceMode.end }).click();

  await expect(page).toHaveURL(path('/chat'));
  await expect(page.getByRole('button', { name: t.chat.pick })).toBeVisible();
});

test('a call with the microphone blocked says so and offers typing', async ({ page, t, path }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
  });
  await page.goto(path('/voice'));

  await expect(page.getByText(t.chat.voice.denied)).toBeVisible();
  await page.getByRole('link', { name: t.voiceMode.keyboard }).click();
  await expect(page).toHaveURL(path('/chat'));
});

test('a blocked microphone says so, and typing still works', async ({ page, t, path }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
  });
  await page.goto(path('/chat'));

  await page.getByRole('button', { name: t.chat.voice.start }).click();
  await expect(page.getByText(t.chat.voice.denied)).toBeVisible();
  await page.getByLabel(t.chat.inputLabel).fill('200');
  await expect(page.getByRole('button', { name: t.common.send })).toBeEnabled();
});
