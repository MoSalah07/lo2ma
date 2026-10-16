import { messages } from '@lo2ma/i18n';
import { expect, test } from './fixtures';

/** The path of an absolute address the build wrote, to fetch it from the server under test. */
const pathOf = (href: string | null) => new URL(href ?? '/', 'http://localhost').pathname;

test('the landing page tells search engines and link previews what it is', async ({
  page,
  t,
  path,
  appLocale,
  request,
}) => {
  await page.goto(path(''));

  await expect(page).toHaveTitle(t.seo.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    t.seo.description,
  );
  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(robots).toContain('index');
  expect(robots).not.toContain('noindex');

  // Its own address, and the same page in the other language.
  const link = (selector: string) => page.locator(`link[${selector}]`).getAttribute('href');
  expect(pathOf(await link('rel="canonical"'))).toBe(`/${appLocale}`);
  expect(pathOf(await link('hreflang="ar-EG"'))).toBe('/ar');
  expect(pathOf(await link('hreflang="en-EG"'))).toBe('/en');
  expect(pathOf(await link('hreflang="x-default"'))).toBe('/ar');

  // The preview picture exists and is light enough for WhatsApp.
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
    'content',
    `${appLocale}_EG`,
  );
  const image = await page.locator('meta[property="og:image"]').getAttribute('content');
  const picture = await request.get(pathOf(image));
  expect(picture.ok()).toBe(true);
  expect(picture.headers()['content-type']).toBe('image/jpeg');
  expect((await picture.body()).byteLength).toBeLessThan(300_000);

  // The structured data is valid JSON and names the brand.
  const graph = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
  ) as { '@graph': { '@type': string; name: string }[] };
  expect(graph['@graph'].map((node) => node['@type'])).toEqual([
    'Organization',
    'WebSite',
    'WebApplication',
  ]);
  expect(graph['@graph'][1]?.name).toBe(t.common.brand);
});

test('app screens stay out of search results', async ({ page, path }) => {
  await page.goto(path('/onboarding'));
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('robots.txt, the sitemap, llms.txt and the manifest are served', async ({ request }) => {
  test.skip(test.info().project.name !== 'ar-light', 'the same files for every project');

  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('User-Agent: GPTBot');
  expect(robots).toContain('User-Agent: ClaudeBot');
  expect(robots).toMatch(/Sitemap: \S+\/sitemap\.xml/);

  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('hreflang="ar-EG"');
  expect(sitemap).toContain('hreflang="x-default"');

  const llms = await request.get('/llms.txt');
  expect(llms.headers()['content-type']).toContain('text/plain');
  const llmsText = await llms.text();
  expect(llmsText.startsWith(`# ${messages.en.common.brand} / ${messages.ar.common.brand}`)).toBe(
    true,
  );
  expect(llmsText).toContain(messages.ar.landing.demoNote);

  const manifest = (await (await request.get('/manifest.webmanifest')).json()) as {
    name: string;
    icons: { src: string }[];
  };
  expect(manifest.name).toBe(messages.ar.common.brand);
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
});
