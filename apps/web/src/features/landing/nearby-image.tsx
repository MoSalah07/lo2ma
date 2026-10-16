'use client';

import Image, { type ImageProps } from 'next/image';
import { useEffect, useRef, useState } from 'react';

/**
 * A decorative photo further down the page (so it has no alt text), requested only when its section comes near
 * the screen. The browser's own lazy loading starts far earlier, about a screen and a half away, which puts these
 * photos in the way of the hero's first paint. It fills its nearest positioned parent, like next/image's `fill`,
 * and shows a blurred version while it loads.
 */
export function NearbyImage(props: Omit<ImageProps, 'alt' | 'fill' | 'loading' | 'placeholder'>) {
  const box = useRef<HTMLSpanElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: '50% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={box} aria-hidden className="absolute inset-0 -z-20">
      {near && <Image {...props} alt="" fill placeholder="blur" />}
    </span>
  );
}
