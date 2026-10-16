import { afterEach, describe, expect, it, vi } from 'vitest';
import robots from './robots';
import sitemap from './sitemap';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('robots.txt', () => {
  const { rules, sitemap: sitemapUrl } = robots();
  const groups = Array.isArray(rules) ? rules : [rules];

  it('lets every crawler read the site, except the API', () => {
    expect(groups[0]).toEqual({ userAgent: '*', allow: '/', disallow: ['/api/'] });
  });

  it('welcomes the AI crawlers by name, search and training alike', () => {
    expect(groups[1]?.userAgent).toEqual(
      expect.arrayContaining([
        'GPTBot',
        'OAI-SearchBot',
        'ClaudeBot',
        'Google-Extended',
        'PerplexityBot',
      ]),
    );
    expect(groups[1]).toMatchObject({ allow: '/', disallow: ['/api/'] });
  });

  it('points to the sitemap', () => {
    expect(sitemapUrl).toBe('http://localhost:3000/sitemap.xml');
  });

  it('closes a Vercel preview to everyone', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.resetModules();
    const { default: previewRobots } = await import('./robots');
    expect(previewRobots()).toEqual({ rules: { userAgent: '*', disallow: '/' } });
  });
});

describe('sitemap.xml', () => {
  it('lists the home page in both languages, each with all its languages', () => {
    const languages = {
      'ar-EG': 'http://localhost:3000/ar',
      'en-EG': 'http://localhost:3000/en',
      'x-default': 'http://localhost:3000/ar',
    };
    expect(sitemap()).toEqual([
      { url: 'http://localhost:3000/ar', alternates: { languages } },
      { url: 'http://localhost:3000/en', alternates: { languages } },
    ]);
  });
});
