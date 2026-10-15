'use client';

import { useSearchParams } from 'next/navigation';

/**
 * Filters kept in the URL (?status=late&page=2), so a filtered view survives a reload and can be shared.
 * Writes go through the browser's history API, which Next.js keeps in sync with useSearchParams without
 * a server round trip. `replace` for typing and filters, `push` for steps worth a Back press (pages).
 */
export function setUrlParams(
  changes: Record<string, string | undefined>,
  mode: 'push' | 'replace' = 'replace',
) {
  const next = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(changes)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  const search = next.toString();
  const url = search ? `?${search}` : window.location.pathname;
  if (mode === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
}

/** Reads one URL parameter; empty means unset. Re-renders when setUrlParams changes the URL. */
export function useUrlParam() {
  const params = useSearchParams();
  return (key: string) => params.get(key) || undefined;
}
