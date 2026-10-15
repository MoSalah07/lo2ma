import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Finds src/i18n/request.ts, which loads the locale's messages from @lo2ma/i18n.
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Memoization is the compiler's job: no manual useMemo/useCallback unless profiling proves a need.
  reactCompiler: true,
  // Our packages ship TypeScript source, so Next compiles them like app code.
  transpilePackages: ['@lo2ma/core', '@lo2ma/i18n', '@lo2ma/tokens'],
};

export default withNextIntl(nextConfig);
