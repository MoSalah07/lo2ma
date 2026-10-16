'use client';

import { directions } from '@lo2ma/i18n/locales';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { LazyScene } from './lazy-scene';
import bowl from './stills/wooden_bowl_02.png';
import lime from './stills/food_lime_01.png';
import onion from './stills/yellow_onion.png';

/** The still 404 picture: the same bowl, lime and onion as the 3D scene, photographed. */
function NotFoundStill() {
  return (
    <div aria-hidden className="absolute inset-0">
      <Image src={bowl} alt="" sizes="16rem" className="absolute inset-x-6 top-14 w-auto" />
      <Image
        src={lime}
        alt=""
        sizes="5rem"
        className="absolute start-1 bottom-10 w-16 -rotate-24"
      />
      <Image src={onion} alt="" sizes="5rem" className="absolute end-2 bottom-8 w-18 rotate-12" />
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
