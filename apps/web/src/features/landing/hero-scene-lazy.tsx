'use client';

import { directions } from '@lo2ma/i18n/locales';
import dynamic from 'next/dynamic';
import { useLocale } from 'next-intl';
import { LazyScene } from '@/components/three/lazy-scene';
import { HeroShapes } from './hero-shapes';

// three.js loads only here, after the page, and only in the browser.
const HeroScene = dynamic(() => import('./hero-scene'), {
  ssr: false,
  loading: () => <HeroShapes />,
});

/** The hero's shapes: the 3D scene where it runs well, the still picture everywhere else. */
export function HeroSceneLazy() {
  const locale = useLocale();
  return (
    <LazyScene
      scene={HeroScene}
      fallback={<HeroShapes />}
      rtl={directions[locale] === 'rtl'}
      deferred
    />
  );
}
