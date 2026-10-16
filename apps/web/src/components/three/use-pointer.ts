'use client';

import { useEffect, useRef } from 'react';

/**
 * Where the pointer is on the window, from -1 to 1 on each axis, kept in a ref so reading it every frame never
 * re-renders. The canvases let clicks through, so the window is what hears the pointer.
 */
export function usePointer() {
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const move = (event: PointerEvent) => {
      pointer.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);
  return pointer;
}
