'use client';

import { useGLTF } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import { Box3, Vector3, type Object3D } from 'three';

/** The food models in public/models (`npm run models`): real, scanned food from Poly Haven. */
export type FoodName = 'lime' | 'pomegranate' | 'onion' | 'bread' | 'croissant' | 'lemon' | 'bowl';

const path = (name: FoodName) => `/models/${name}.glb`;

/** Starts downloading models before a scene needs them. Meshopt only, so no decoder is fetched from elsewhere. */
export function preloadFood(...names: FoodName[]) {
  for (const name of names) useGLTF.preload(path(name), false, true);
}

/** A copy of a model, centered and scaled so its largest side is 1: every food is placed and sized alike. */
function normalize(source: Object3D): Object3D {
  const model = source.clone(true);
  const box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());
  const scale = 1 / Math.max(size.x, size.y, size.z);
  model.position.copy(box.getCenter(new Vector3())).multiplyScalar(-scale);
  model.scale.setScalar(scale);
  return model;
}

type FoodProps = ThreeElements['group'] & {
  name: FoodName;
  /** About how many scene units across. */
  size?: number;
};

/** One real food, centered on its position. */
export function Food({ name, size = 1, ...props }: FoodProps) {
  const { scene } = useGLTF(path(name), false, true);
  return (
    <group scale={size} {...props}>
      <primitive object={normalize(scene)} />
    </group>
  );
}
