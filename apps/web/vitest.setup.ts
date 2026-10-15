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
