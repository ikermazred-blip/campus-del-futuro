import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { BoxInst } from "../facade";

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

interface Props {
  items: BoxInst[];
  material: THREE.Material;
  geometry?: THREE.BufferGeometry;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/** Draws many boxes (or any geometry) in one draw call. */
export function InstancedBoxes({ items, material, geometry = UNIT_BOX, castShadow = true, receiveShadow = true }: Props) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    items.forEach((b, i) => {
      o.position.set(b.p[0], b.p[1], b.p[2]);
      o.rotation.set(b.r?.[0] ?? 0, b.r?.[1] ?? 0, b.r?.[2] ?? 0);
      o.scale.set(b.s[0], b.s[1], b.s[2]);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      if (b.c) mesh.setColorAt(i, col.set(b.c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.computeBoundingBox();
  }, [items]);

  if (items.length === 0) return null;
  return (
    <instancedMesh
      key={items.length}
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}
