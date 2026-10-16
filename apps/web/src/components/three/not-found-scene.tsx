'use client';

import { ContactShadows } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { MathUtils, type Group } from 'three';
import { Food, preloadFood } from './food';
import type { SceneProps } from './lazy-scene';
import { SceneCanvas } from './scene-canvas';
import { usePointer } from './use-pointer';

preloadFood('pot', 'spoon', 'lime', 'onion');

/** How wide the pot is with its handles. The model is 0.3 as tall as it is wide, and it stands on the table. */
const POT = 2.6;
const TABLE = -(POT * 0.3) / 2;
/** The spoon, and how far it leans out of the pot. */
const SPOON = 1.6;
const LEAN = 0.45;
/** One slow round of the spoon in the empty pot. */
const STIR_SECONDS = 7;

function EmptyPot({ side }: { side: number }) {
  const table = useRef<Group>(null);
  const stir = useRef<Group>(null);
  const pointer = usePointer();

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    // The table turns a little on its own and with the pointer, so the brass catches the light.
    if (table.current) {
      const turn = (Math.sin(time / 5) * 0.2 + pointer.current.x * 0.35) * side;
      table.current.rotation.y = MathUtils.damp(table.current.rotation.y, turn, 3, delta);
    }
    if (stir.current) stir.current.rotation.y = (time / STIR_SECONDS) * Math.PI * 2 * side;
  });

  return (
    <group ref={table}>
      <Food name="pot" size={POT} />
      {/* The spoon stirs an empty pot: whatever was cooking here is gone. */}
      <group ref={stir} position-y={TABLE}>
        <group
          position={[0.3 + (SPOON / 2) * Math.sin(LEAN), 0.1 + (SPOON / 2) * Math.cos(LEAN), 0]}
          rotation-z={-LEAN}
        >
          {/* The model lies along z; standing it up puts its bowl down in the pot. */}
          <Food name="spoon" size={SPOON} rotation-x={-Math.PI / 2} />
        </group>
      </group>
      <Food
        name="lime"
        size={0.55}
        position={[1.6 * side, TABLE + 0.25, 0.7]}
        rotation={[0.2, 0.6, 0.1]}
      />
      <Food
        name="onion"
        size={0.68}
        position={[-1.65 * side, TABLE + 0.31, 0.35]}
        rotation={[0, 0.4, 0.15]}
      />
      <ContactShadows
        position-y={TABLE}
        scale={8}
        blur={2.2}
        far={1.6}
        opacity={0.5}
        resolution={256}
      />
    </group>
  );
}

/** The 404 picture: an empty copper pot on a table, a wooden spoon going round in it. */
export default function NotFoundScene({ onDecline, rtl }: SceneProps) {
  return (
    <SceneCanvas onDecline={onDecline} distance={5.3} elevation={28}>
      <EmptyPot side={rtl ? -1 : 1} />
    </SceneCanvas>
  );
}
