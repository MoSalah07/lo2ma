import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Finds src/i18n/request.ts, which loads the locale's messages from @lo2ma/i18n.
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Memoization is the compiler's job: no manual useMemo/useCallback unless profiling proves a need.
  reactCompiler: true,
  experimental: {
    // Unknown URLs get app/global-not-found.tsx, rendered on the server with a 404 status. Our root layout lives
    // under [locale], so there is no other way to give them our own page outside the browser.
    globalNotFound: true,
  },
  // Our packages ship TypeScript source, so Next compiles them like app code.
  transpilePackages: ['@lo2ma/core', '@lo2ma/i18n', '@lo2ma/tokens'],
  // With the mocks off, /api/* goes on to FastAPI (API_URL, the local one by default). The browser only ever talks
  // to this origin: the session cookie stays first-party and there is no CORS.
  rewrites() {
    const api = process.env.API_URL ?? 'http://127.0.0.1:8000';
    return Promise.resolve(
      process.env.NEXT_PUBLIC_API_MOCKING === 'disabled'
        ? [{ source: '/api/:path*', destination: `${api}/api/:path*` }]
        : [],
    );
  },
};

export default withNextIntl(nextConfig);
