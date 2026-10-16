import { defaultLocale, directions, regionTags } from '@lo2ma/i18n/locales';
import { colors } from '@lo2ma/tokens';
import type { MetadataRoute } from 'next';
import { getTranslations } from 'next-intl/server';
import { localizedPath } from '@/lib/seo/metadata';

/**
 * The web app manifest: the name, colors and icons a phone uses when Lo2ma is added to the home screen, and that
 * browsers and search engines read as the app's identity. One per site, in the default language. The PNG icons
 * are made by `npm run images`.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({ locale: defaultLocale });
  return {
    name: t('common.brand'),
    short_name: t('common.brand'),
    description: t('seo.description'),
    lang: regionTags[defaultLocale],
    dir: directions[defaultLocale],
    start_url: localizedPath(defaultLocale),
    scope: '/',
    display: 'standalone',
    background_color: colors.light.bg,
    theme_color: colors.light.bg,
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/512.png', sizes: '512x512', type: 'image/png' },
      // Android crops it to a circle or a squircle, so the mark sits inside the safe middle.
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
