'use client';

import { Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { MathUtils, type Group } from 'three';
import type { SceneProps } from '@/components/three/lazy-scene';
import { Bite, Bowl, Pill, Ring } from '@/components/three/low-poly';
import { SceneCanvas } from '@/components/three/scene-canvas';

/** The shapes rise into place this fast, then float. */
const ENTER_SECONDS = 0.6;

function Pieces({ rtl }: { rtl: boolean }) {
  const group = useRef<Group>(null);
  // The canvas lets clicks through to the chat example, so the pointer is read from the window.
  const pointer = useRef({ x: 0, y: 0 });
  // «end» is on the left in Arabic, like the still picture's logical positions.
  const end = rtl ? -1 : 1;

  useEffect(() => {
    const move = (event: PointerEvent) => {
      pointer.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);

  useFrame((state) => {
    const current = group.current;
    if (!current) return;
    const progress = Math.min(state.clock.elapsedTime / ENTER_SECONDS, 1);
    const eased = 1 - (1 - progress) ** 3;
    current.scale.setScalar(0.6 + 0.4 * eased);
    current.position.y = (1 - eased) * -1.4;
    // Lean a little toward the pointer, up to about ten degrees.
    current.rotation.y = MathUtils.lerp(current.rotation.y, pointer.current.x * 0.17, 0.06);
    current.rotation.x = MathUtils.lerp(current.rotation.x, pointer.current.y * 0.12, 0.06);
  });

  return (
    <group ref={group}>
      <Float speed={1.4} floatIntensity={0.6} rotationIntensity={0.5}>
        <Bite position={[1.85 * end, 1.2, 0]} scale={0.75} rotation={[0.2, -0.5, 0]} />
      </Float>
      <Float speed={1.1} floatIntensity={0.5} rotationIntensity={0.3}>
        <Bowl position={[-2 * end, -1.35, 0]} scale={0.8} rotation={[0.5, 0.3, 0.1]} />
      </Float>
      <Float speed={1.6} floatIntensity={0.7} rotationIntensity={0.6}>
        <Pill position={[2.05 * end, -1.55, 0.3]} scale={0.75} rotation={[0, 0, 0.5]} />
      </Float>
      <Float speed={1.3} floatIntensity={0.5} rotationIntensity={0.4}>
        <Ring position={[-1.95 * end, 1.4, -0.4]} scale={0.6} rotation={[0.6, 0.4, 0]} />
      </Float>
    </group>
  );
}

/** The landing hero's shapes in 3D, around the chat example. Loaded only in the browser. */
export default function HeroScene({ onDecline, rtl }: SceneProps) {
  return (
    <SceneCanvas onDecline={onDecline}>
      <Pieces rtl={rtl} />
    </SceneCanvas>
  );
}
