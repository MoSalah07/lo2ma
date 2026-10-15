/**
 * Phase 1 runs on MSW mocks. Set NEXT_PUBLIC_API_MOCKING=disabled once FastAPI is ready (phase 2):
 * nothing else in the app changes, because every request already goes through /api.
 */
export const apiMocking = process.env.NEXT_PUBLIC_API_MOCKING !== 'disabled';

let started: Promise<unknown> | undefined;

/** Starts the mock service worker once, in the browser only. The mock code is loaded on demand. */
export function ensureMocks(): Promise<unknown> {
  if (!apiMocking || typeof window === 'undefined') return Promise.resolve();
  started ??= import('@/mocks/browser').then(({ worker }) =>
    worker.start({ onUnhandledFrame: 'bypass', quiet: true }),
  );
  return started;
}
