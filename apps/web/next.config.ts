import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import createNextIntlPlugin from 'next-intl/plugin';

// Finds src/i18n/request.ts, which loads the locale's messages from @lo2ma/i18n.
const withNextIntl = createNextIntlPlugin();

/**
 * NEXT_PUBLIC_API_MOCKING: 'enabled' runs the mock API in the browser (npm run dev, npm run build:demo); unset or
 * 'disabled' calls the real one. A typo is refused rather than read as either.
 */
function apiMocking(): boolean {
  const value = process.env.NEXT_PUBLIC_API_MOCKING;
  if (value !== undefined && value !== 'enabled' && value !== 'disabled') {
    throw new Error(`NEXT_PUBLIC_API_MOCKING must be "enabled" or "disabled", not "${value}"`);
  }
  return value === 'enabled';
}

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
};

export default function config(phase: string): NextConfig {
  const mocking = apiMocking();
  // A production build says what it talks to: the demo's mock API, or a real one at API_URL. Nothing is assumed, so
  // a forgotten variable stops the build instead of shipping the demo or an API on localhost. `next typegen` loads
  // this file in the build phase too, so `npm run typecheck` runs it as the demo: it writes route types, no app.
  if (phase === PHASE_PRODUCTION_BUILD && !mocking && !process.env.API_URL) {
    throw new Error(
      'Say what this build talks to: API_URL for the real API, or NEXT_PUBLIC_API_MOCKING=enabled for the demo (npm run build:demo).',
    );
  }
  return withNextIntl({
    ...nextConfig,
    // With the mocks off, /api/* goes on to FastAPI (API_URL, the local one in development). The browser only ever
    // talks to this origin: the session cookie stays first-party and there is no CORS.
    rewrites() {
      const api = process.env.API_URL ?? 'http://127.0.0.1:8000';
      return Promise.resolve(
        mocking ? [] : [{ source: '/api/:path*', destination: `${api}/api/:path*` }],
      );
    },
  });
}
