'use client';

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from 'react';

/** What every 3D scene gets from LazyScene. */
export interface SceneProps {
  /** Called when the frame rate stays low: the still picture comes back. */
  onDecline: () => void;
  /** Arabic pages mirror the scene, like the layout around it. */
  rtl: boolean;
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeToMotion(onChange: () => void) {
  const query = matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** True when the user turned motion off. The server assumes so, and the browser corrects it. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotion,
    () => matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
}

const noSubscription = () => () => {};

/** Whether this device should get 3D: WebGL 2 works and it isn't a low-end phone. Checked once. */
let capable: boolean | undefined;
function checkCapable(): boolean {
  if (capable !== undefined) return capable;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency || 8;
  let webgl = false;
  try {
    const probe = document.createElement('canvas').getContext('webgl2');
    webgl = probe !== null;
    // Browsers allow only a few live contexts, so the test one is given back at once.
    probe?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    // A browser that throws here can't run the scenes, unless the context was already made.
  }
  capable = webgl && memory >= 4 && cores >= 4;
  return capable;
}

/** Whether a scene would show here at all, so its library is only downloaded when it will be used. */
export function canShowScene(): boolean {
  return !matchMedia(REDUCED_MOTION).matches && checkCapable();
}

/** How long the page has to be quiet before a deferred scene starts without any interaction. */
const SETTLE_MS = 5_000;
const INTERACTIONS = ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart'] as const;

/**
 * Turns true once the page has settled: on the first interaction, or after a few quiet seconds. The scene's
 * library then never competes with the page's own loading and first taps.
 */
function useSettled(enabled: boolean): boolean {
  const [settled, setSettled] = useState(!enabled);
  useEffect(() => {
    if (!enabled) return;
    const settle = () => setSettled(true);
    for (const name of INTERACTIONS)
      window.addEventListener(name, settle, { once: true, passive: true });
    const timer = window.setTimeout(settle, SETTLE_MS);
    return () => {
      for (const name of INTERACTIONS) window.removeEventListener(name, settle);
      window.clearTimeout(timer);
    };
  }, [enabled]);
  return settled;
}

interface LazySceneProps {
  /** A scene loaded with next/dynamic and `ssr: false`, so three.js stays out of every other bundle. */
  scene: ComponentType<SceneProps>;
  /** The still picture: on the server, on weak devices, with reduced motion, and if the frame rate drops. */
  fallback: ReactNode;
  rtl: boolean;
  /** Wait for the page to settle before loading the scene. For pictures on a page people land on. */
  deferred?: boolean;
}

/** Shows a 3D scene only where it runs well, and the still picture everywhere else. */
export function LazyScene({ scene: Scene, fallback, rtl, deferred = false }: LazySceneProps) {
  // The server can't know either, so it renders the still picture and the browser decides.
  const reducedMotion = useReducedMotion();
  const able = useSyncExternalStore(noSubscription, checkCapable, () => false);
  const settled = useSettled(deferred);
  const [declined, setDeclined] = useState(false);

  if (reducedMotion || !able || declined || !settled) return fallback;
  return <Scene rtl={rtl} onDecline={() => setDeclined(true)} />;
}
