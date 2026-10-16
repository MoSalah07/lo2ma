'use client';

import { directions } from '@lo2ma/i18n/locales';
import { Check } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useLocale } from 'next-intl';
import { useEffect, useRef } from 'react';
import { Appear } from '@/components/motion/entrance';
import { canShowScene, LazyScene, useReducedMotion } from '@/components/three/lazy-scene';

const loadScene = () => import('@/components/three/success-scene');

/**
 * Starts loading the 3D while the user is still on the payment screen, so the moment never waits. Only where
 * the scene will show, and only once the screen is idle, so it never competes with the bill loading.
 */
export function preloadSuccessScene() {
  if (!canShowScene()) return;
  if (typeof requestIdleCallback === 'function') requestIdleCallback(() => void loadScene());
  else window.setTimeout(() => void loadScene(), 1_000);
}

/** The still version, for weak devices and reduced motion: a big check. */
function SuccessStill() {
  return (
    <div aria-hidden className="absolute inset-0 flex items-center justify-center">
      <span className="flex size-24 items-center justify-center rounded-full bg-good text-on-good">
        <Check className="size-12" strokeWidth={2.5} />
      </span>
    </div>
  );
}

const SuccessScene = dynamic(loadScene, { ssr: false, loading: () => <SuccessStill /> });

interface SuccessMomentProps {
  /** «اتبعت للمطعم!» or «الخطة اتأكدت!». */
  title: string;
  note: string;
  /** Called when the moment is over: about 1.6 s, or 1 s with reduced motion. */
  onDone: () => void;
}

/** A short full-screen celebration after paying or confirming a plan, then on to the next screen. */
export function SuccessMoment({ title, note, onDone }: SuccessMomentProps) {
  const locale = useLocale();
  const reducedMotion = useReducedMotion();
  const done = useRef(onDone);
  const heading = useRef<HTMLHeadingElement>(null);

  // Focus moves to the news, so a screen reader says it and the keyboard leaves the screen behind.
  useEffect(() => heading.current?.focus(), []);

  // The timer reads the latest callback, so a parent re-render doesn't restart it.
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    const timer = window.setTimeout(() => done.current(), reducedMotion ? 1_000 : 1_600);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-bg">
      <div className="flex w-full max-w-app flex-col items-center px-gutter pb-clear-nav">
        <div className="relative w-full flex-1">
          <LazyScene
            scene={SuccessScene}
            fallback={<SuccessStill />}
            rtl={directions[locale] === 'rtl'}
          />
        </div>
        <Appear className="flex flex-col items-center gap-2 text-center">
          <h2
            ref={heading}
            tabIndex={-1}
            className="text-28 leading-heading font-extrabold outline-none"
          >
            {title}
          </h2>
          <p className="text-15 text-ink-2">{note}</p>
        </Appear>
      </div>
    </div>
  );
}
