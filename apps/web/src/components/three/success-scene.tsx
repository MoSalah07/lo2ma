'use client';

import { useFrame } from '@react-three/fiber';
import { useRef, type ComponentType } from 'react';
import type { Group } from 'three';
import type { SceneProps } from './lazy-scene';
import { Bag, Bite, Bowl, Pill, Ring } from './low-poly';
import { SceneCanvas } from './scene-canvas';

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
/** Overshoots a little, then settles: the pieces "pop" out of the bag. */
const easeOutBack = (t: number) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2;

const BAG_Y = 0.35;

/** Where each piece lands after it pops out of the bag («end» side first, mirrored in Arabic). */
const pieces: {
  Shape: ComponentType<{ scale?: number }>;
  to: [number, number, number];
  scale: number;
}[] = [
  { Shape: Bite, to: [-0.85, 1.7, 0], scale: 0.45 },
  { Shape: Ring, to: [0.9, 1.85, -0.3], scale: 0.38 },
  { Shape: Pill, to: [0.95, -0.95, 0.2], scale: 0.38 },
  { Shape: Bowl, to: [-0.95, -1.05, 0], scale: 0.42 },
  { Shape: Bite, to: [0.5, 2.25, -0.6], scale: 0.24 },
];

function Burst({ side }: { side: number }) {
  const bag = useRef<Group>(null);
  const flying = useRef<(Group | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // 0–300 ms: the bag rises from below.
    const rise = easeOutCubic(clamp(t / 0.3));
    if (bag.current) {
      bag.current.position.y = -3.6 + (BAG_Y + 3.6) * rise;
      bag.current.rotation.z = (1 - rise) * 0.35 * side;
      bag.current.rotation.y = t * 0.4;
    }
    // 400–800 ms: the pieces burst out of it, then settle and turn slowly.
    const burst = easeOutBack(clamp((t - 0.4) / 0.4));
    flying.current.forEach((group, index) => {
      const piece = pieces[index];
      if (!group || !piece) return;
      const [x, y, z] = piece.to;
      group.position.set(x * side * burst, BAG_Y + (y - BAG_Y) * burst, z);
      group.scale.setScalar(Math.max(piece.scale * burst, 0.001));
      group.rotation.y = t * 0.6 + index;
    });
  });

  return (
    <>
      <group ref={bag}>
        <Bag scale={1.1} />
      </group>
      {pieces.map(({ Shape }, index) => (
        <group
          key={index}
          ref={(group) => {
            flying.current[index] = group;
          }}
        >
          <Shape />
        </group>
      ))}
    </>
  );
}

/** The moment an order is paid or a plan confirmed: a bag pops up and lunch bursts out of it. */
export default function SuccessScene({ onDecline, rtl }: SceneProps) {
  return (
    <SceneCanvas onDecline={onDecline} distance={7}>
      <Burst side={rtl ? -1 : 1} />
    </SceneCanvas>
  );
}
