import type { Page } from '@playwright/test';
import { seriousIssues } from './axe';
import { expect, test } from './fixtures';

const TILES = 'https://tiles.openfreemap.org';

/**
 * The map's tiles and fonts come from OpenFreeMap. Here they are empty, so the journeys never wait on the network
 * or fail with it; the map still runs, moves and reports where it is. The route is on the context, not the page:
 * MapLibre fetches from its web worker, which a page route never sees.
 */
async function emptyMap(page: Page) {
  await page.context().route(`${TILES}/**`, (route) => {
    if (new URL(route.request().url()).pathname === '/planet') {
      return route.fulfill({
        json: { tilejson: '3.0.0', tiles: [`${TILES}/planet/{z}/{x}/{y}.pbf`], maxzoom: 14 },
      });
    }
    return route.fulfill({ contentType: 'application/x-protobuf', body: Buffer.alloc(0) });
  });
}

const cfc = /Cairo Festival City · Business Park|كايرو فستيفال سيتي · بيزنس بارك/;

test.beforeEach(async ({ page }) => emptyMap(page));

// With motion reduced, MapLibre jumps to a place instead of flying there, so a journey never waits on a 70 km
// flight drawn in software; what the picker does once the map stops is the same.
test.use({ reducedMotion: 'reduce' });

test('a workplace is found by search, placed on the map and confirmed with notes', async ({
  page,
  t,
  path,
  appLocale,
}) => {
  await page.goto(path('/onboarding'));
  const field = page.getByRole('button', { name: t.prefs.workplace });
  await field.click();

  const picker = page.getByRole('dialog', { name: t.location.title });
  await expect(picker).toBeVisible();
  const search = picker.getByRole('combobox', { name: t.location.searchLabel });
  await search.fill(appLocale === 'ar' ? 'فستيفال' : 'festival');
  await picker.getByRole('option', { name: cfc }).click();

  // The map flies there; once it stops, the sheet names the building under the pin.
  await expect(picker.getByText(cfc)).toBeVisible({ timeout: 15_000 });
  await picker.getByLabel(t.location.detailsLabel).fill('Tower B');
  expect(await seriousIssues(page)).toEqual([]);

  await picker.getByRole('button', { name: t.location.confirm }).click();
  await expect(picker).toBeHidden();
  await expect(field).toContainText(cfc);
  await expect(field).toContainText('Tower B');
});

test('the workplace at the top of the chat opens the map, and the new place is saved', async ({
  page,
  t,
  path,
  appLocale,
}) => {
  await page.goto(path('/onboarding'));
  await page.getByRole('button', { name: t.onboarding.start }).click();
  await expect(page).toHaveURL(path('/chat'));

  const chip = page.getByRole('button', { name: new RegExp(t.prefs.workplace) });
  await chip.click();
  const picker = page.getByRole('dialog', { name: t.location.title });
  await picker
    .getByRole('combobox', { name: t.location.searchLabel })
    .fill(appLocale === 'ar' ? 'فستيفال' : 'festival');
  await picker.getByRole('option', { name: cfc }).click();
  await expect(picker.getByText(cfc)).toBeVisible({ timeout: 15_000 });
  await picker.getByRole('button', { name: t.location.confirm }).click();

  await expect(picker).toBeHidden();
  await expect(chip).toContainText(cfc);
  await page.reload();
  await expect(page.getByRole('button', { name: new RegExp(t.prefs.workplace) })).toContainText(
    cfc,
  );
});

test.describe('with the location allowed', () => {
  test.use({ permissions: ['geolocation'], geolocation: { latitude: 30.011, longitude: 31.74 } });

  test('«my location» moves the pin, and a place Lo2ma does not reach cannot be confirmed', async ({
    page,
    t,
    path,
  }) => {
    await page.goto(path('/onboarding'));
    await page.getByRole('button', { name: t.prefs.workplace }).click();
    const picker = page.getByRole('dialog', { name: t.location.title });

    await picker.getByRole('button', { name: t.location.useMyLocation }).click();
    await expect(picker.getByText(t.location.outsideArea)).toBeVisible({ timeout: 15_000 });
    await expect(picker.getByRole('button', { name: t.location.confirm })).toBeDisabled();

    // Escape closes the picker and keeps the workplace as it was.
    await page.keyboard.press('Escape');
    await expect(picker).toBeHidden();
  });
});
