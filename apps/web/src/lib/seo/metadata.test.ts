import { describe, expect, it } from 'vitest';
import {
  languageAlternates,
  localizedPath,
  publicPageMetadata,
  siteMetadata,
  type SeoText,
} from './metadata';

const text: SeoText = {
  brand: 'لقمة',
  title: 'لقمة · غداك',
  description: 'وصف',
  imageAlt: 'طبق كشري',
};

describe('addresses', () => {
  it('put the locale first', () => {
    expect(localizedPath('ar')).toBe('/ar');
    expect(localizedPath('en', '/plan')).toBe('/en/plan');
  });

  it('list the page in every language, by region, with Arabic as the default', () => {
    expect(languageAlternates()).toEqual({ 'ar-EG': '/ar', 'en-EG': '/en', 'x-default': '/ar' });
  });
});

describe('siteMetadata', () => {
  const metadata = siteMetadata('ar', text);

  it('keeps every page out of search results unless it asks', () => {
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it('resolves relative links against the site and names pages after the brand', () => {
    expect(metadata.metadataBase).toBeInstanceOf(URL);
    expect(metadata.title).toEqual({ default: text.title, template: '%s · لقمة' });
  });

  it('gives every page a large link preview in its language', () => {
    expect(metadata.openGraph).toMatchObject({
      siteName: 'لقمة',
      locale: 'ar_EG',
      alternateLocale: ['en_EG'],
      images: [{ url: '/og/ar.jpg', width: 1200, height: 630, alt: text.imageAlt }],
    });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
  });
});

describe('publicPageMetadata', () => {
  const metadata = publicPageMetadata('en', '', { ...text, brand: 'Lo2ma' });

  it('asks search engines to list the page, with a full snippet and a large image', () => {
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
      googleBot: { 'max-image-preview': 'large' },
    });
  });

  it('names its canonical address and its other languages', () => {
    expect(metadata.alternates).toEqual({
      canonical: '/en',
      languages: { 'ar-EG': '/ar', 'en-EG': '/en', 'x-default': '/ar' },
    });
  });

  it('builds the whole preview, since Next replaces the layout one', () => {
    expect(metadata.openGraph).toMatchObject({
      url: '/en',
      siteName: 'Lo2ma',
      locale: 'en_EG',
      images: [{ url: '/og/en.jpg' }],
    });
  });

  it('uses its full title, without the brand pattern', () => {
    expect(metadata.title).toEqual({ absolute: text.title });
  });
});
