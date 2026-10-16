'use client';

import { ContactShadows } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { easeOutBack, easeOutBounce, stepProgress } from './easing';
import { Food, preloadFood, type FoodName } from './food';
import type { SceneProps } from './lazy-scene';
import { SceneCanvas } from './scene-canvas';

/** Where each ingredient comes to rest in the bowl (x on the «end» side when positive), and its size. */
const ingredients: { name: FoodName; rest: [number, number, number]; size: number }[] = [
  { name: 'bread', rest: [-0.35, -0.35, 0.1], size: 0.95 },
  { name: 'pomegranate', rest: [0.45, -0.3, 0.15], size: 0.6 },
  { name: 'lime', rest: [0.05, -0.15, 0.45], size: 0.42 },
  { name: 'onion', rest: [-0.6, -0.1, -0.2], size: 0.45 },
  { name: 'lemon', rest: [0.6, -0.05, -0.3], size: 0.36 },
];
preloadFood('bowl', ...ingredients.map((ingredient) => ingredient.name));

/** 0–350 ms: the bowl rises into place. Then each ingredient falls in this long after the previous one. */
const BOWL_SECONDS = 0.35;
const FALL_SECONDS = 0.6;
const FALL_GAP = 0.11;
const DROP_HEIGHT = 3.6;

function LunchInTheBowl({ side }: { side: number }) {
  const bowl = useRef<Group>(null);
  const falling = useRef<(Group | null)[]>([]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const risen = easeOutBack(stepProgress(time, 0, BOWL_SECONDS));
    if (bowl.current) {
      bowl.current.position.y = -0.85 - (1 - risen) * 2.5;
      bowl.current.rotation.y = time * 0.25;
    }
    falling.current.forEach((group, index) => {
      const ingredient = ingredients[index];
      if (!group || !ingredient) return;
      const progress = stepProgress(time, BOWL_SECONDS * 0.6 + index * FALL_GAP, FALL_SECONDS);
      const [x, y, z] = ingredient.rest;
      group.visible = progress > 0;
      group.position.set(x * side, y + (1 - easeOutBounce(progress)) * DROP_HEIGHT, z);
      group.rotation.set(progress * 2.5 + index, progress * 1.5, 0);
    });
  });

  return (
    <>
      <group ref={bowl} rotation={[0.42, 0, 0]}>
        <Food name="bowl" size={2.4} />
      </group>
      {ingredients.map((ingredient, index) => (
        <group
          key={ingredient.name}
          visible={false}
          ref={(group) => {
            falling.current[index] = group;
          }}
        >
          <Food name={ingredient.name} size={ingredient.size} />
        </group>
      ))}
      <ContactShadows
        position={[0, -1.6, 0]}
        scale={7}
        blur={2.6}
        far={3}
        opacity={0.35}
        resolution={256}
      />
    </>
  );
}

/** The moment an order is paid or a plan confirmed: lunch falls into its bowl. */
export default function SuccessScene({ onDecline, rtl }: SceneProps) {
  return (
    <SceneCanvas onDecline={onDecline} distance={6.2}>
      <LunchInTheBowl side={rtl ? -1 : 1} />
    </SceneCanvas>
  );
}
