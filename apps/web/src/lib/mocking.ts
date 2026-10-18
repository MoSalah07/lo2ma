/**
 * The mock API (MSW, in the browser) runs only when asked for: NEXT_PUBLIC_API_MOCKING=enabled, which
 * `npm run dev` (.env.development) and `npm run build:demo` set. Anything else calls the real API through
 * /api, so a forgotten variable can never put a real customer on the demo. next.config.ts checks the value.
 */
export const apiMocking = process.env.NEXT_PUBLIC_API_MOCKING === 'enabled';

let started: Promise<unknown> | undefined;

/** Starts the mock service worker once, in the browser only. The mock code is loaded on demand. */
export function ensureMocks(): Promise<unknown> {
  if (!apiMocking || typeof window === 'undefined') return Promise.resolve();
  started ??= import('@/mocks/browser').then(({ worker }) =>
    worker.start({ onUnhandledFrame: 'bypass', quiet: true }),
  );
  return started;
}
