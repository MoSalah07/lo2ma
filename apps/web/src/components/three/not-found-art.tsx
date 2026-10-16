'use client';

import { directions } from '@lo2ma/i18n/locales';
import dynamic from 'next/dynamic';
import { useLocale } from 'next-intl';
import { LazyScene } from './lazy-scene';

/** The still 404 picture: a bitten green bite over a golden bowl. */
function NotFoundStill() {
  return (
    <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-end gap-2 pb-6">
      <span className="relative size-32 overflow-hidden rounded-full bg-scene-brand">
        <span className="absolute -end-4 -top-4 size-14 rounded-full bg-bg" />
      </span>
      <span className="h-20 w-56 rounded-b-full bg-scene-highlight" />
    </div>
  );
}

const NotFoundScene = dynamic(() => import('./not-found-scene'), {
  ssr: false,
  loading: () => <NotFoundStill />,
});

/** The 404 page's picture: in 3D where the device allows, the still one everywhere else. */
export function NotFoundArt() {
  const locale = useLocale();
  return (
    <div className="relative size-75 shrink-0">
      <LazyScene
        scene={NotFoundScene}
        fallback={<NotFoundStill />}
        rtl={directions[locale] === 'rtl'}
      />
    </div>
  );
}
