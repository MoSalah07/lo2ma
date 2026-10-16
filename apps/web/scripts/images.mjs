// The pictures that stand for Lo2ma outside its pages: the link preview card in each language (public/og/<locale>.jpg,
// 1200×630) and the app icons (public/icons/*.png and src/app/apple-icon.png). Chrome draws them from the tokens,
// the messages, the brand mark and the hero photo, so Arabic is shaped right and nothing drifts from the site.
// Run it after changing any of those: `npm run images -w @lo2ma/web`. It needs the network once, for the font.
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { directions, locales } from '@lo2ma/i18n/locales';
import { colors } from '@lo2ma/tokens';
import { chromium } from '@playwright/test';

const app = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const messages = (locale) =>
  JSON.parse(
    readFileSync(
      new URL(`../../../packages/i18n/messages/${locale}.json`, import.meta.url),
      'utf8',
    ),
  );
const dataUrl = (path, type) => `data:${type};base64,${readFileSync(app(path)).toString('base64')}`;

const mark = readFileSync(app('src/app/icon.svg'), 'utf8');
const photo = dataUrl('src/features/landing/photos/koshari-hand.jpg', 'image/jpeg');
const font =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alexandria:wght@400;500;800&display=block">';

/** The preview card: dark, like a food brand's, with the hero's koshari and the first line of a chat. */
function card(locale) {
  const m = messages(locale);
  const c = colors.dark;
  return `<!doctype html>
<html lang="${locale}" dir="${directions[locale]}">
<head>${font}<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; background: ${c.bg}; color: ${c.ink};
    font-family: Alexandria, sans-serif; display: grid; grid-template-columns: 1fr 520px; }
  .text { display: flex; flex-direction: column; justify-content: center; gap: 28px; padding-inline: 72px 24px; }
  .brand { display: inline-flex; align-items: baseline; gap: 10px; font-size: 40px; font-weight: 800; }
  .dot { width: 14px; height: 14px; border-radius: 50%; background: ${c.primary}; }
  .eyebrow { align-self: flex-start; padding: 8px 20px; border-radius: 999px; background: ${c.accent};
    color: ${c.onAccent}; font-size: 22px; font-weight: 500; }
  h1 { font-size: 60px; line-height: 1.25; font-weight: 800; text-wrap: balance; }
  .photo { position: relative; }
  .photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
    mask-image: radial-gradient(closest-side, black 55%, transparent 100%); }
  .bubble { position: absolute; inset-inline-end: 56px; bottom: 96px; white-space: nowrap; padding: 16px 24px;
    border-radius: 28px; background: ${c.primary}; color: ${c.onPrimary}; font-size: 24px; font-weight: 500; }
</style></head>
<body>
  <div class="text">
    <span class="brand">${m.common.brand}<span class="dot"></span></span>
    <span class="eyebrow">${m.landing.eyebrow}</span>
    <h1>${m.landing.title}</h1>
  </div>
  <div class="photo"><img src="${photo}" alt=""><p class="bubble">${m.landing.preview.user}</p></div>
</body></html>`;
}

/** The brand mark on a square: `padding` is the share of each side left empty, for icons a platform crops. */
const icon = (size, { padding = 0, background = 'transparent' } = {}) => `<!doctype html>
<html><head><style>
  * { margin: 0; }
  body { width: ${size}px; height: ${size}px; background: ${background}; display: grid; place-items: center; }
  svg { width: ${size * (1 - 2 * padding)}px; height: ${size * (1 - 2 * padding)}px; }
</style></head><body>${mark}</body></html>`;

mkdirSync(app('public/og'), { recursive: true });
mkdirSync(app('public/icons'), { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
async function render(html, size, path, { type = 'png', omitBackground = false } = {}) {
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: app(path),
    type,
    omitBackground,
    ...(type === 'jpeg' && { quality: 85 }),
  });
  await page.close();
  console.log(`✓ ${path}`);
}

try {
  // JPEG keeps a photo card small: WhatsApp skips previews much over 300 KB.
  for (const locale of locales) {
    await render(card(locale), { width: 1200, height: 630 }, `public/og/${locale}.jpg`, {
      type: 'jpeg',
    });
  }
  for (const size of [192, 512]) {
    await render(icon(size), { width: size, height: size }, `public/icons/${size}.png`, {
      omitBackground: true,
    });
  }
  // Android crops maskable icons to its own shape, keeping only the middle 80%.
  await render(
    icon(512, { padding: 0.2, background: colors.light.bg }),
    { width: 512, height: 512 },
    'public/icons/maskable-512.png',
  );
  // iOS fills a transparent icon with black, so it gets the page color, and draws its own rounded corners.
  await render(
    icon(180, { padding: 0.14, background: colors.light.bg }),
    { width: 180, height: 180 },
    'src/app/apple-icon.png',
  );
} finally {
  await browser.close();
}
