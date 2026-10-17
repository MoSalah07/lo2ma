'use client';

import { useEffect, useState } from 'react';

/** The value, once it has stopped changing for `delay` ms. Used so typing a search fires one request. */
export function useDebounced<T>(value: T, delay = 250): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
}
