'use client';

import { ContactShadows } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { Food, preloadFood } from './food';
import type { SceneProps } from './lazy-scene';
import { SceneCanvas } from './scene-canvas';

preloadFood('bowl', 'lime', 'onion');

/** One slow turn of the bowl, and one lap of the ingredients around it. */
const TURN_SECONDS = 24;
const LAP_SECONDS = 9;

function EmptyBowl({ side }: { side: number }) {
  const bowl = useRef<Group>(null);
  const lime = useRef<Group>(null);
  const onion = useRef<Group>(null);

  useFrame((state, delta) => {
    if (bowl.current) bowl.current.rotation.y += (delta * Math.PI * 2) / TURN_SECONDS;
    const lap = (state.clock.elapsedTime / LAP_SECONDS) * Math.PI * 2 * side;
    // The two ingredients roll around the empty bowl, half a lap apart: the bite they were for is gone.
    for (const [ref, offset] of [
      [lime, 0],
      [onion, Math.PI],
    ] as const) {
      const current = ref.current;
      if (!current) continue;
      current.position.set(Math.cos(lap + offset) * 1.85, -0.5, Math.sin(lap + offset) * 0.9);
      current.rotation.z = -(lap + offset) * 2;
    }
  });

  return (
    <>
      <group ref={bowl} position={[0, 0, 0]} rotation={[0.38, 0, 0]}>
        <Food name="bowl" size={2.5} />
      </group>
      <group ref={lime}>
        <Food name="lime" size={0.55} />
      </group>
      <group ref={onion}>
        <Food name="onion" size={0.6} />
      </group>
      <ContactShadows
        position={[0, -0.9, 0]}
        scale={7}
        blur={2.4}
        far={2.5}
        opacity={0.4}
        resolution={256}
      />
    </>
  );
}

/** The 404 picture: an empty wooden bowl turning slowly, its ingredients rolling around it. */
export default function NotFoundScene({ onDecline, rtl }: SceneProps) {
  return (
    <SceneCanvas onDecline={onDecline} distance={5.6}>
      <EmptyBowl side={rtl ? -1 : 1} />
    </SceneCanvas>
  );
}
