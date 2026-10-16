import type { RootState } from '@react-three/fiber';
import { MathUtils, PerspectiveCamera } from 'three';

/**
 * Half the width and the height the camera sees at depth `z`, in scene units, for a camera looking straight down
 * the z axis. A piece placed within them stays whole, at any canvas shape: wide on a desktop, tall on a phone.
 */
export function visibleHalf({ camera, size }: Pick<RootState, 'camera' | 'size'>, z = 0) {
  const fov = camera instanceof PerspectiveCamera ? camera.fov : 40;
  const y = Math.tan(MathUtils.degToRad(fov / 2)) * (camera.position.z - z);
  return { x: y * (size.width / Math.max(size.height, 1)), y };
}
