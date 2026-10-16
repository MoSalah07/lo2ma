'use client';

import { useAnimationControls, useInView } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useIsClient } from '@/lib/use-is-client';

/** When an entrance plays: as soon as it mounts, or when it scrolls into view. */
export type EntranceTrigger = 'mount' | 'scroll';

interface Entrance {
  /** A callback ref, so it fits any element. */
  ref: (element: HTMLElement | null) => void;
  initial: 'hidden' | false;
  animate: 'shown' | ReturnType<typeof useAnimationControls>;
}

/**
 * Decides when an entrance plays. Nothing that comes with the page's HTML starts hidden: the first paint, the
 * LCP and people without JavaScript never wait on an animation.
 * - `mount`: plays for content that appears in the browser later (a new message, a card after loading, a screen
 *   after navigating); content present at hydration stays as it is.
 * - `scroll`: content below the fold is hidden once the page is interactive (nobody sees it yet) and rises when
 *   it scrolls into view; content already on screen stays as it is.
 */
export function useEntrance(trigger: EntranceTrigger): Entrance {
  const isClient = useIsClient();
  const element = useRef<HTMLElement | null>(null);
  const controls = useAnimationControls();
  const inView = useInView(element, { once: true, amount: 0.2 });
  const waiting = useRef(false);

  useEffect(() => {
    const node = element.current;
    if (trigger !== 'scroll' || !node || node.getBoundingClientRect().top < window.innerHeight)
      return;
    controls.set('hidden');
    waiting.current = true;
  }, [trigger, controls]);

  useEffect(() => {
    if (trigger === 'scroll' && inView && waiting.current) void controls.start('shown');
  }, [trigger, inView, controls]);

  const ref = (node: HTMLElement | null) => {
    element.current = node;
  };
  if (trigger === 'scroll') return { ref, initial: false, animate: controls };
  return { ref, initial: isClient ? 'hidden' : false, animate: 'shown' };
}
