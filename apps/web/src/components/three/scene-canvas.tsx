'use client';

import { sceneLights } from '@lo2ma/tokens';
import { AdaptiveDpr, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { MathUtils, NeutralToneMapping } from 'three';
import { cn } from '@/lib/cn';

interface SceneCanvasProps {
  children: ReactNode;
  onDecline: () => void;
  /** Where the canvas sits. It covers its box by default; a scene can let it reach past the box. */
  className?: string;
  /** How far the camera stands back; bigger shows more of the scene. */
  distance?: number;
  /** How high the camera looks down from, in degrees: 0 is eye level, so a table top needs some. */
  elevation?: number;
}

/**
 * The shared stage for every 3D scene: a transparent canvas over the page's own background, lit like a food shoot
 * and rendered with Khronos PBR Neutral tone mapping, which keeps a model's colors as they were scanned (the
 * default, ACES, darkens and desaturates them). The light is a warm key from the side, a soft box above, a fill,
 * a dim card for metal to mirror, and a cool rim from behind that lifts each piece off a dark page, rendered once
 * into an environment map, with nothing downloaded. Quality drops by itself (AdaptiveDpr) or gives up (PerformanceMonitor) on slow devices.
 * The scene is decoration only, so screen readers skip it, and it stops drawing while it is scrolled away.
 */
export function SceneCanvas({
  children,
  onDecline,
  className,
  distance = 6,
  elevation = 0,
}: SceneCanvasProps) {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const angle = MathUtils.degToRad(elevation);

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
        camera={{
          position: [0, Math.sin(angle) * distance, Math.cos(angle) * distance],
          fov: 40,
        }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'low-power',
          toneMapping: NeutralToneMapping,
        }}
      >
        {/* Measured again from scratch after a pause, so the time away never counts as slow frames. */}
        {visible && <PerformanceMonitor onDecline={onDecline} />}
        <AdaptiveDpr pixelated />
        <ambientLight intensity={0.15} />
        <directionalLight position={[3, 5, 4]} intensity={1.7} color={sceneLights.key} />
        {/* Rough skins (onion, wood) catch no reflection, so the rim needs a real light too. */}
        <directionalLight position={[-3, 2, -5]} intensity={1.4} color={sceneLights.rim} />
        <Environment resolution={256} frames={1}>
          <Lightformer
            form="rect"
            intensity={2.5}
            position={[0, 6, 1]}
            scale={[10, 5, 1]}
            color={sceneLights.key}
          />
          <Lightformer form="rect" intensity={1} position={[-5, 0.5, 4]} scale={[4, 6, 1]} />
          {/* A wide, dim card behind the camera: metal and glossy skins mirror their surroundings, and without
              it the front of a copper pot would mirror black. */}
          <Lightformer form="rect" intensity={0.7} position={[0, 1, 8]} scale={[14, 6, 1]} />
          <Lightformer
            form="rect"
            intensity={4}
            position={[4.5, 1, -5]}
            scale={[1.5, 8, 1]}
            color={sceneLights.rim}
          />
          <Lightformer
            form="rect"
            intensity={3}
            position={[-4.5, 1, -5]}
            scale={[1.5, 8, 1]}
            color={sceneLights.rim}
          />
        </Environment>
        {/* The models stream in; the scene simply appears when they are there. */}
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}
