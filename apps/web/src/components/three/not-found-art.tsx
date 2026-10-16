'use client';

import { directions } from '@lo2ma/i18n/locales';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { LazyScene } from './lazy-scene';
import pot from './stills/brass_pot_02.png';
import lime from './stills/food_lime_01.png';
import spoon from './stills/wooden_spoon.png';
import onion from './stills/yellow_onion.png';

/** The still 404 picture: the same pot, spoon, lime and onion as the 3D scene, photographed. */
function NotFoundStill() {
  return (
    <div aria-hidden className="absolute inset-0">
      {/* Behind the pot, so it reads as standing in it. */}
      <Image
        src={spoon}
        alt=""
        sizes="5rem"
        className="absolute end-1/3 top-4 h-44 w-auto rotate-24 rtl:-rotate-24"
      />
      <Image src={pot} alt="" sizes="18rem" className="absolute inset-x-16 bottom-14 w-auto" />
      <Image src={lime} alt="" sizes="4rem" className="absolute end-4 bottom-10 w-14 -rotate-24" />
      <Image
        src={onion}
        alt=""
        sizes="5rem"
        className="absolute start-3 bottom-12 w-16 rotate-12"
      />
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
    <div className="relative aspect-4/3 w-full shrink-0">
      <LazyScene
        scene={NotFoundScene}
        fallback={<NotFoundStill />}
        rtl={directions[locale] === 'rtl'}
      />
    </div>
  );
}
