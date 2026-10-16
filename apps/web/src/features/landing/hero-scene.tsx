'use client';

import { Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { MathUtils, type Group } from 'three';
import { easeOutBack, stepProgress } from '@/components/three/easing';
import { Food, preloadFood, type FoodName } from '@/components/three/food';
import { visibleHalf } from '@/components/three/frame';
import type { SceneProps } from '@/components/three/lazy-scene';
import { SceneCanvas } from '@/components/three/scene-canvas';
import { usePointer } from '@/components/three/use-pointer';

interface Piece {
  name: FoodName;
  /**
   * Where it floats, as a share of the room from the middle to the edge: x toward the «end» side (mirrored in
   * Arabic, like the layout), y up. 1 is as far out as it can go and still be whole.
   */
  at: [number, number];
  /** Toward the camera (+) or away from it (-). */
  z: number;
  /** Its size, as a share of half the canvas's shorter side, so the scene keeps its look on any screen. */
  size: number;
  /** How near it feels, 0–1: near pieces follow the pointer and the scroll more than far ones. */
  depth: number;
  /** The side it shows, in radians. */
  turn: [number, number, number];
  /** How fast it turns on itself, in radians a second: slowly, like food on a turntable. */
  spin: number;
}

// In the corners the round bowl leaves empty, over its rim but never over the food or the chat card.
const pieces: Piece[] = [
  {
    name: 'pomegranate',
    at: [1, -0.75],
    z: 0.8,
    size: 0.46,
    depth: 1,
    turn: [0.3, 0.6, 0.2],
    spin: 0.18,
  },
  {
    name: 'spoon',
    at: [-1, -0.35],
    z: 0.5,
    size: 0.72,
    depth: 0.85,
    // Upright and leaning in, its bowl dipping into the koshari, its hollow toward us.
    turn: [1.2, Math.PI - 0.6, 0],
    spin: 0,
  },
  {
    name: 'lime',
    at: [-1, 0.85],
    z: 0.3,
    size: 0.34,
    depth: 0.7,
    turn: [0.2, 0.9, 0],
    spin: -0.22,
  },
  { name: 'onion', at: [1, 0.8], z: 0, size: 0.4, depth: 0.55, turn: [0.15, 0, 0.25], spin: 0.15 },
  {
    name: 'lemon',
    at: [0.05, 1],
    z: -1,
    size: 0.26,
    depth: 0.3,
    turn: [0.4, 1.2, 0.3],
    spin: -0.12,
  },
];
preloadFood(...pieces.map((piece) => piece.name));

/** Each piece rises into place this long after the previous one. */
const ENTER_SECONDS = 0.9;
const ENTER_GAP = 0.12;
/** How far the nearest piece follows the pointer, and drifts up as the hero scrolls away, in scene units. */
const POINTER_X = 0.25;
const POINTER_Y = 0.2;
const SCROLL_DRIFT = 0.4;
/** The room Float's bobbing takes. */
const BOB = 0.1;
/** easeOutBack overshoots by about a tenth before it settles: room for that too. */
const OVERSHOOT = 1.1;

interface FloatingFoodProps {
  piece: Piece;
  index: number;
  side: number;
  pointer: ReturnType<typeof usePointer>;
}

function FloatingFood({ piece, index, side, pointer }: FloatingFoodProps) {
  const group = useRef<Group>(null);
  const spinner = useRef<Group>(null);
  const placed = useRef(false);

  useFrame((state, delta) => {
    const current = group.current;
    if (!current) return;
    // Sized and placed from what the camera sees at the piece's depth, so nothing reaches an edge of the canvas.
    const stage = visibleHalf(state);
    const size = piece.size * Math.min(stage.x, stage.y);
    const radius = (size / 2) * OVERSHOOT;
    const half = visibleHalf(state, piece.z);
    const room = {
      x: Math.max(half.x - radius - BOB - POINTER_X * piece.depth, 0),
      y: Math.max(half.y - radius - BOB - POINTER_Y * piece.depth, 0),
    };
    const scrolled = Math.min(window.scrollY / window.innerHeight, 1);
    const x = piece.at[0] * room.x * side + pointer.current.x * POINTER_X * piece.depth;
    // The drift stops at the top edge rather than carry a piece out of the canvas.
    const y = Math.min(
      piece.at[1] * room.y -
        pointer.current.y * POINTER_Y * piece.depth +
        scrolled * SCROLL_DRIFT * piece.depth,
      half.y - radius - BOB,
    );

    const entered = easeOutBack(
      stepProgress(state.clock.elapsedTime, index * ENTER_GAP, ENTER_SECONDS),
    );
    const rise = (1 - entered) * 0.8;
    if (!placed.current) {
      current.position.set(x, y - rise, piece.z);
      placed.current = true;
    }
    // damp, not a fixed lerp: the same smoothness at 30 and at 120 frames a second.
    current.position.x = MathUtils.damp(current.position.x, x, 5, delta);
    current.position.y = MathUtils.damp(current.position.y, y - rise, 7, delta);
    current.scale.setScalar(Math.max(0.001, size * entered));
    if (spinner.current) spinner.current.rotation.y += delta * piece.spin * side;
  });

  return (
    <group ref={group} position-z={piece.z} scale={0.001}>
      <Float speed={1 + index * 0.12} rotationIntensity={0.25} floatIntensity={0.6}>
        <group ref={spinner}>
          {/* Mirrored in Arabic like the layout, so the spoon still leans toward the bowl. */}
          <Food
            name={piece.name}
            rotation={[piece.turn[0], piece.turn[1] * side, piece.turn[2] * side]}
          />
        </group>
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
    // The canvas reaches past the photo to the page's side padding, so the pieces have room around the bowl
    // and the canvas's edge never shows.
    <SceneCanvas
      onDecline={onDecline}
      className="-inset-x-gutter -inset-y-6 md:-inset-x-gutter-md lg:-inset-x-gutter-lg"
    >
      {pieces.map((piece, index) => (
        <FloatingFood key={piece.name} piece={piece} index={index} side={side} pointer={pointer} />
      ))}
    </SceneCanvas>
  );
}
