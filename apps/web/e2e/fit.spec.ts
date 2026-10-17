import { seriousIssues } from './axe';
import { expect, fill, test } from './fixtures';

// «وضع الفورمة»: a lunch goal worked out on the phone, meals matched to it, and how an estimate was made.

const ask = {
  ar: 'معايا 250 جنيه، عايز حاجة بروتين أعلى',
  en: 'I have EGP 250, more protein please',
};

test('fit mode works out a lunch goal, and the chat matches meals to it', async ({
  page,
  t,
  path,
  appLocale,
}) => {
  const calories = fill(t.format.calories, { kcal: '780' });
  const protein = fill(t.format.grams, { grams: '57' });

  await page.goto(path('/onboarding'));
  await page.getByRole('button', { name: t.fit.title }).click();
  const dialog = page.getByRole('dialog', { name: t.fit.title });
  await expect(dialog).toBeVisible();

  // The design canvas's example: a man of 28, 178 cm and 82 kg, cutting, who trains 3 or 4 days a week.
  await dialog.getByRole('button', { name: t.fit.sexes.male, exact: true }).click();
  await dialog.getByLabel(t.fit.age).fill('28');
  await dialog.getByLabel(t.fit.heightCm).fill('178');
  await dialog.getByLabel(t.fit.weightKg).fill('82');
  await expect(dialog.getByText(calories, { exact: true })).toBeVisible();
  await expect(dialog.getByText(protein, { exact: true })).toBeVisible();
  expect(await seriousIssues(page)).toEqual([]);

  await dialog.getByRole('button', { name: t.fit.save }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(fill(t.fit.summary, { calories, protein }))).toBeVisible();

  await page.getByRole('button', { name: t.onboarding.start }).click();
  await expect(page).toHaveURL(path('/chat'));
  await expect(page.getByRole('button', { name: new RegExp(t.chat.lunchGoal) })).toBeVisible();
  await expect(
    page.getByRole('button', { name: t.chat.quickReplies.moreProtein, exact: true }),
  ).toBeVisible();

  await page.getByLabel(t.chat.inputLabel).fill(ask[appLocale]);
  await page.getByRole('button', { name: t.common.send }).click();
  await expect(page.getByRole('button', { name: t.chat.pick })).toBeVisible({ timeout: 15_000 });
  // The meal card measures the meal against the goal.
  await expect(page.getByRole('meter', { name: t.fit.calories }).first()).toBeVisible();
  expect(await seriousIssues(page)).toEqual([]);

  await page.getByRole('link', { name: t.common.details }).first().click();
  await expect(page.getByRole('heading', { name: t.fit.closeness })).toBeVisible();
});

test('an estimated meal shows how its calories were worked out, and takes a report', async ({
  page,
  t,
  path,
  appLocale,
}) => {
  // Mashweyat El Dar doesn't publish its calories: kofta with rice, and a tahini salad.
  await page.goto(path('/meals/r02.m1.m4'));
  await page.getByRole('button', { name: t.meal.how }).click();

  const sheet = page.getByRole('dialog', { name: t.meal.how });
  await expect(sheet).toBeVisible();
  const kofta = appLocale === 'ar' ? 'كفتة مشوية + رز' : 'Grilled kofta + rice';
  await expect(sheet.getByRole('table', { name: kofta })).toBeVisible();
  expect(await seriousIssues(page)).toEqual([]);

  await sheet.getByRole('button', { name: t.meal.report }).click();
  await expect(sheet.getByRole('status')).toHaveText(t.meal.reported);
});
