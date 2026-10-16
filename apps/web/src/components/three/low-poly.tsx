'use client';

import { sceneColors } from '@lo2ma/tokens';
import type { ThreeElements } from '@react-three/fiber';
import { DoubleSide, IcosahedronGeometry, Vector3 } from 'three';

// The storyboard's five shapes, built from three.js primitives with flat shading: low-poly, in brand colors,
// and nothing to download.

type GroupProps = ThreeElements['group'];

/** «اللقمة»: a faceted ball with a bite pressed out of its upper side. */
function makeBite() {
  const geometry = new IcosahedronGeometry(1, 1);
  const position = geometry.getAttribute('position');
  const bite = new Vector3(0.7, 0.7, 0.3).normalize();
  const point = new Vector3();
  for (let index = 0; index < position.count; index += 1) {
    point.fromBufferAttribute(position, index);
    const distance = point.distanceTo(bite);
    if (distance < 0.8) {
      point.multiplyScalar(0.6 + distance * 0.4);
      position.setXYZ(index, point.x, point.y, point.z);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

const biteGeometry = makeBite();

export function Bite(props: GroupProps) {
  return (
    <group {...props}>
      <mesh geometry={biteGeometry}>
        <meshStandardMaterial color={sceneColors.brand} flatShading roughness={0.55} />
      </mesh>
    </group>
  );
}

export function Bowl(props: GroupProps) {
  return (
    <group {...props}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={sceneColors.pink} flatShading side={DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[0.98, 8]} />
        <meshStandardMaterial color={sceneColors.lilac} flatShading />
      </mesh>
    </group>
  );
}

export function Pill(props: GroupProps) {
  return (
    <group {...props}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.36, 0.8, 2, 8]} />
        <meshStandardMaterial color={sceneColors.lilac} flatShading />
      </mesh>
    </group>
  );
}

/** The break-time clock, as a ring. */
export function Ring(props: GroupProps) {
  return (
    <group {...props}>
      <mesh>
        <torusGeometry args={[0.62, 0.24, 6, 10]} />
        <meshStandardMaterial color={sceneColors.tint} flatShading />
      </mesh>
    </group>
  );
}

/** The takeaway bag that lunch arrives in. */
export function Bag(props: GroupProps) {
  return (
    <group {...props}>
      <mesh>
        <boxGeometry args={[1, 1.15, 0.55]} />
        <meshStandardMaterial color={sceneColors.brand} flatShading />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <torusGeometry args={[0.28, 0.06, 4, 8, Math.PI]} />
        <meshStandardMaterial color={sceneColors.deep} flatShading />
      </mesh>
    </group>
  );
}
