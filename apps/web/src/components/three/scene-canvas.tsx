'use client';

import { AdaptiveDpr, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SceneCanvasProps {
  children: ReactNode;
  onDecline: () => void;
  className?: string;
  /** How far the camera stands back; bigger shows more of the scene. */
  distance?: number;
}

/**
 * The shared stage for every 3D scene: a transparent canvas over the page's own background, studio light that
 * real food reflects (a soft box above, a fill and a rim, rendered once into an environment map, nothing
 * downloaded), and quality that drops by itself (AdaptiveDpr) or gives up (PerformanceMonitor) on slow devices.
 * The scene is decoration only, so screen readers skip it, and it stops drawing while it is scrolled away.
 */
export function SceneCanvas({ children, onDecline, className, distance = 6 }: SceneCanvasProps) {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const element = box.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry?.isIntersecting ?? true),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={box} aria-hidden className={cn('pointer-events-none absolute inset-0', className)}>
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, 2]}
        camera={{ position: [0, 0, distance], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      >
        {/* Measured again from scratch after a pause, so the time away never counts as slow frames. */}
        {visible && <PerformanceMonitor onDecline={onDecline} />}
        <AdaptiveDpr pixelated />
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 5, 4]} intensity={1.6} />
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={3} position={[0, 5, 2]} scale={[10, 4, 1]} />
          <Lightformer form="rect" intensity={1.2} position={[-5, 1, 3]} scale={[3, 5, 1]} />
          <Lightformer form="ring" intensity={2} position={[5, 2, -4]} scale={3} />
        </Environment>
        {/* The models stream in; the scene simply appears when they are there. */}
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}
