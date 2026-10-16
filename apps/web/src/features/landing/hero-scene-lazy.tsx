'use client';

import { directions } from '@lo2ma/i18n/locales';
import dynamic from 'next/dynamic';
import { useLocale } from 'next-intl';
import { LazyScene } from '@/components/three/lazy-scene';

// three.js loads only here, after the page, and only in the browser.
const HeroScene = dynamic(() => import('./hero-scene'), { ssr: false });

/**
 * The real ingredients floating around the hero's koshari, where the device runs 3D well. Everywhere else the
 * photo stands on its own, so there is no separate still picture.
 */
export function HeroSceneLazy() {
  const locale = useLocale();
  return (
    <LazyScene scene={HeroScene} fallback={null} rtl={directions[locale] === 'rtl'} deferred />
  );
}
