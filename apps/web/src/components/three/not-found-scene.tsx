'use client';

import { sceneColors } from '@lo2ma/tokens';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, Mesh } from 'three';
import type { SceneProps } from './lazy-scene';
import { Bite, Bowl } from './low-poly';
import { SceneCanvas } from './scene-canvas';

/** One slow turn of the bite, and how often a crumb falls into the bowl. */
const TURN_SECONDS = 20;
const CRUMB_EVERY_SECONDS = 6;

function Plate({ side }: { side: number }) {
  const bite = useRef<Group>(null);
  const crumb = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (bite.current) bite.current.rotation.y += (delta * Math.PI * 2) / TURN_SECONDS;
    if (crumb.current) {
      const cycle = (state.clock.elapsedTime % CRUMB_EVERY_SECONDS) / CRUMB_EVERY_SECONDS;
      const fall = Math.min(cycle * 5, 1);
      crumb.current.position.y = 0.55 - fall * 1.45;
      crumb.current.visible = cycle < 0.22;
    }
  });

  return (
    <>
      <Bowl position={[0, -0.95, 0]} scale={1.25} rotation={[0.22, 0, 0]} />
      <group ref={bite} position={[0, 0.75, 0]}>
        <Bite scale={0.78} />
      </group>
      <mesh ref={crumb} position={[0.95 * side, 0.55, 0.45]} scale={0.13}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={sceneColors.cobalt} flatShading />
      </mesh>
    </>
  );
}

/** The 404 picture: a bitten «لقمة» turning slowly over its bowl. */
export default function NotFoundScene({ onDecline, rtl }: SceneProps) {
  return (
    <SceneCanvas onDecline={onDecline} distance={5.2}>
      <Plate side={rtl ? -1 : 1} />
    </SceneCanvas>
  );
}
