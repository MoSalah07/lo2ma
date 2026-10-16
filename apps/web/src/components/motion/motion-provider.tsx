'use client';

import { LazyMotion, MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { transition } from './presets';

const loadFeatures = () => import('./features').then((module) => module.default);

/**
 * Motion for the whole app. The animation engine loads on its own after the page is interactive (`strict` keeps
 * any component from pulling in the full library), and people who turn motion off get changes without movement.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={transition('enter', 'enter')}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
