/** What the site's address and indexing depend on, read once from the environment. */
interface SiteEnv {
  /** Set it once a domain exists, like https://lo2ma.app. */
  SITE_URL?: string;
  /** Vercel sets these on every deployment: the production domain, and which kind of deployment this is. */
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  VERCEL_ENV?: string;
  /** The codes Google Search Console and Bing Webmaster Tools give to prove the site is yours. */
  GOOGLE_SITE_VERIFICATION?: string;
  BING_SITE_VERIFICATION?: string;
}

/**
 * The site's public address, for canonical links, the sitemap and link previews: the configured domain, else the
 * Vercel production domain (previews point there too, so they never compete with it), else the local server.
 */
export function resolveSiteUrl(env: SiteEnv): URL {
  if (env.SITE_URL) return new URL(env.SITE_URL);
  if (env.VERCEL_PROJECT_PRODUCTION_URL)
    return new URL(`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`);
  return new URL('http://localhost:3000');
}

/** Search engines may list the production site, and a local build that is being audited; never a preview. */
export function resolveIndexable(env: SiteEnv): boolean {
  return env.VERCEL_ENV === undefined || env.VERCEL_ENV === 'production';
}

/** The ownership tags for search consoles, only for the codes that are set. */
export function resolveVerification(env: SiteEnv) {
  return {
    ...(env.GOOGLE_SITE_VERIFICATION && { google: env.GOOGLE_SITE_VERIFICATION }),
    ...(env.BING_SITE_VERIFICATION && { other: { 'msvalidate.01': env.BING_SITE_VERIFICATION } }),
  };
}

const env: SiteEnv = {
  SITE_URL: process.env.SITE_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  GOOGLE_SITE_VERIFICATION: process.env.GOOGLE_SITE_VERIFICATION,
  BING_SITE_VERIFICATION: process.env.BING_SITE_VERIFICATION,
};

export const siteUrl = resolveSiteUrl(env);
export const indexable = resolveIndexable(env);
export const verification = resolveVerification(env);

/** The pages search engines list, as paths after the locale ('' is the home page). Everything else is noindex. */
export const publicPaths = [''] as const;

/** An absolute address on the site. */
export const absoluteUrl = (path: string) => new URL(path, siteUrl).href;
