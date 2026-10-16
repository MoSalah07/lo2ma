'use client';

import { Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { MathUtils, type Group } from 'three';
import { easeOutBack, stepProgress } from '@/components/three/easing';
import { Food, preloadFood, type FoodName } from '@/components/three/food';
import type { SceneProps } from '@/components/three/lazy-scene';
import { SceneCanvas } from '@/components/three/scene-canvas';
import { usePointer } from '@/components/three/use-pointer';

interface Piece {
  name: FoodName;
  /** x is on the «end» side when positive, mirrored in Arabic like the layout. */
  position: [number, number, number];
  size: number;
  /** How near it is: near pieces follow the pointer and the scroll more than far ones. */
  depth: number;
}

// Around the koshari photo, leaving its middle free.
const pieces: Piece[] = [
  { name: 'pomegranate', position: [1.25, -1.1, 0.9], size: 0.9, depth: 1 },
  { name: 'bread', position: [-1.3, -1.3, 0.6], size: 1.2, depth: 0.85 },
  { name: 'lime', position: [-1.6, 1.25, 0.2], size: 0.62, depth: 0.6 },
  { name: 'onion', position: [1.55, 1.35, -0.3], size: 0.7, depth: 0.5 },
  { name: 'lemon', position: [0.1, 1.95, -1.3], size: 0.45, depth: 0.3 },
];
preloadFood(...pieces.map((piece) => piece.name));

/** Each piece rises into place this long after the previous one. */
const ENTER_SECONDS = 0.9;
const ENTER_GAP = 0.12;

interface FloatingFoodProps {
  piece: Piece;
  index: number;
  side: number;
  pointer: ReturnType<typeof usePointer>;
}

function FloatingFood({ piece, index, side, pointer }: FloatingFoodProps) {
  const group = useRef<Group>(null);
  const [x, y, z] = piece.position;

  useFrame((state) => {
    const current = group.current;
    if (!current) return;
    const entered = easeOutBack(
      stepProgress(state.clock.elapsedTime, index * ENTER_GAP, ENTER_SECONDS),
    );
    // As the page scrolls, the pieces drift up out of the hero, the near ones faster.
    const scrolled = Math.min(window.scrollY / window.innerHeight, 1);
    const targetX = x * side + pointer.current.x * 0.35 * piece.depth;
    const targetY =
      y +
      (1 - entered) * -1.4 -
      pointer.current.y * 0.25 * piece.depth +
      scrolled * 2.2 * piece.depth;
    current.position.x = MathUtils.lerp(current.position.x, targetX, 0.08);
    current.position.y = MathUtils.lerp(current.position.y, targetY, 0.12);
    current.scale.setScalar(Math.max(0.001, entered));
  });

  return (
    <group ref={group} position={[x * side, y - 1.4, z]}>
      <Float speed={1.2 + index * 0.15} rotationIntensity={0.8} floatIntensity={0.7}>
        <Food name={piece.name} size={piece.size} rotation={[0.3 * index, 0.8 * index, 0]} />
      </Float>
    </group>
  );
}

/** Real ingredients floating around the hero's koshari, in 3D. Loaded only in the browser. */
export default function HeroScene({ onDecline, rtl }: SceneProps) {
  const side = rtl ? -1 : 1;
  // One listener for every piece.
  const pointer = usePointer();
  return (
    <SceneCanvas onDecline={onDecline}>
      {pieces.map((piece, index) => (
        <FloatingFood key={piece.name} piece={piece} index={index} side={side} pointer={pointer} />
      ))}
    </SceneCanvas>
  );
}
