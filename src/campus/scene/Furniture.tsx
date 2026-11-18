import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export const FURNITURE_URL = {
  bookshelf: "/models/bookshelf.glb",
  chair: "/models/chair-1.glb",
  chairSoft: "/models/chair-4.glb",
  shelf: "/models/shelf-large.glb",
  plant: "/models/houseplant-1.glb",
  plantTall: "/models/houseplant-3.glb",
  deskLamp: "/models/light-desk.glb",
  stool: "/models/stool.glb",
  couch: "/models/couch-small1.glb",
  drawer: "/models/drawer-1.glb",
  bin: "/models/trashcan-small1.glb",
  floorLamp: "/models/light-floor1.glb",
} as const;

export type FurnitureKey = keyof typeof FURNITURE_URL;

interface Props {
  model: FurnitureKey;
  /** target height in metres */
  h: number;
  p: [number, number, number];
  ry?: number;
}

/** A CC0 furniture model scaled to a real-world height, sitting on y = p[1]. */
export function Furniture({ model, h, p, ry = 0 }: Props) {
  const { scene } = useGLTF(FURNITURE_URL[model]);
  const obj = useMemo(() => {
    const inner = scene.clone(true);
    const box = new THREE.Box3().setFromObject(inner);
    const size = box.getSize(new THREE.Vector3());
    const s = h / Math.max(0.01, size.y);
    inner.scale.setScalar(s);
    const c = box.getCenter(new THREE.Vector3());
    inner.position.set(-c.x * s, -box.min.y * s, -c.z * s);
    inner.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    const g = new THREE.Group();
    g.add(inner);
    return g;
  }, [scene, h]);
  return <primitive object={obj} position={p} rotation={[0, ry, 0]} />;
}

for (const url of Object.values(FURNITURE_URL)) useGLTF.preload(url);
