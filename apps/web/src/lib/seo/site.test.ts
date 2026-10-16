import { describe, expect, it } from 'vitest';
import { resolveIndexable, resolveSiteUrl, resolveVerification } from './site';

describe('the site address', () => {
  it('is the configured domain first', () => {
    const url = resolveSiteUrl({
      SITE_URL: 'https://lo2ma.app',
      VERCEL_PROJECT_PRODUCTION_URL: 'lo2ma.vercel.app',
    });
    expect(url.href).toBe('https://lo2ma.app/');
  });

  it('is the Vercel production domain without one, so previews point to production too', () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'lo2ma.vercel.app' }).href).toBe(
      'https://lo2ma.vercel.app/',
    );
  });

  it('is the local server otherwise', () => {
    expect(resolveSiteUrl({}).origin).toBe('http://localhost:3000');
  });
});

describe('indexing', () => {
  it('is allowed in production and in a local build, never on a preview', () => {
    expect(resolveIndexable({ VERCEL_ENV: 'production' })).toBe(true);
    expect(resolveIndexable({})).toBe(true);
    expect(resolveIndexable({ VERCEL_ENV: 'preview' })).toBe(false);
    expect(resolveIndexable({ VERCEL_ENV: 'development' })).toBe(false);
  });
});

describe('search console verification', () => {
  it('adds a tag only for the codes that are set', () => {
    expect(resolveVerification({})).toEqual({});
    expect(resolveVerification({ GOOGLE_SITE_VERIFICATION: 'g-code' })).toEqual({
      google: 'g-code',
    });
    expect(resolveVerification({ BING_SITE_VERIFICATION: 'b-code' })).toEqual({
      other: { 'msvalidate.01': 'b-code' },
    });
  });
});
