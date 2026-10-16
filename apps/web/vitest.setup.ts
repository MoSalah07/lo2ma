import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Some tests run in the node environment (API contract tests); only touch the DOM when there is one.
const hasDom = typeof window !== 'undefined';

afterEach(() => {
  if (!hasDom) return;
  cleanup();
  localStorage.clear();
  document.documentElement.className = '';
});

/** jsdom has no IntersectionObserver, which motion entrances use; in tests nothing is ever scrolled into view. */
class NoIntersections {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

if (hasDom && typeof IntersectionObserver === 'undefined') {
  Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: NoIntersections });
}

if (hasDom) {
  // jsdom has no matchMedia. next-themes uses it to read the system theme, so default to light.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
