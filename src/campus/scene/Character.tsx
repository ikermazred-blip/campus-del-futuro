import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Billboard, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { CharacterModel, Pose } from "../rooms";
import { makeLabelTexture } from "../textures";

export const CHARACTER_URL: Record<CharacterModel, string> = {
  profesor: `${import.meta.env.BASE_URL}models/char-profesor.glb`,
  planificadora: `${import.meta.env.BASE_URL}models/char-planificadora.glb`,
  preparador: `${import.meta.env.BASE_URL}models/char-preparador.glb`,
  entrenadora: `${import.meta.env.BASE_URL}models/char-entrenadora.glb`,
  proyectos: `${import.meta.env.BASE_URL}models/char-proyectos.glb`,
  orientadora: `${import.meta.env.BASE_URL}models/char-orientadora.glb`,
};

const HEIGHT = 1.74;
const HIPS_SEATED = 0.52;
const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);
const D = Math.PI / 180;

/** Rotate a bone about an axis expressed in the character root's frame. */
function rotate(root: THREE.Object3D, bone: THREE.Object3D | undefined, axis: THREE.Vector3, deg: number) {
  if (!bone?.parent) return;
  root.updateMatrixWorld(true);
  const rootQ = root.getWorldQuaternion(new THREE.Quaternion());
  const parentQ = bone.parent.getWorldQuaternion(new THREE.Quaternion());
  const rel = rootQ.clone().invert().multiply(parentQ); // parent in root frame
  const q = new THREE.Quaternion().setFromAxisAngle(axis, deg * D);
  const local = rel.clone().invert().multiply(q).multiply(rel);
  bone.quaternion.premultiply(local);
  bone.updateMatrixWorld(true);
}

function applyPose(root: THREE.Object3D, pose: Pose) {
  const b = (n: string) => root.getObjectByName(n);
  // T-pose → relaxed arms
  rotate(root, b("UpperArmL"), Z, -72);
  rotate(root, b("UpperArmR"), Z, 72);
  rotate(root, b("LowerArmL"), Z, -8);
  rotate(root, b("LowerArmR"), Z, 8);

  const seated = pose === "sitDesk" || pose === "sitRead";
  if (seated) {
    for (const s of ["L", "R"]) {
      rotate(root, b(`UpperLeg${s}`), X, -88);
      rotate(root, b(`LowerLeg${s}`), X, 85);
    }
    rotate(root, b("UpperLegL"), Y, 6);
    rotate(root, b("UpperLegR"), Y, -6);
    rotate(root, b("Abdomen"), X, 6);
    // forearms resting on the desk
    rotate(root, b("UpperArmL"), X, -28);
    rotate(root, b("UpperArmR"), X, -28);
    rotate(root, b("LowerArmL"), X, -62);
    rotate(root, b("LowerArmR"), X, -62);
    rotate(root, b("LowerArmL"), Y, -22);
    rotate(root, b("LowerArmR"), Y, 22);
    if (pose === "sitRead") {
      rotate(root, b("Neck"), X, 14);
      rotate(root, b("Head"), X, 8);
    }
  }
  if (pose === "present") {
    // right hand holds notes, left hand gestures to the audience
    rotate(root, b("UpperArmR"), X, -20);
    rotate(root, b("LowerArmR"), X, -70);
    rotate(root, b("UpperArmL"), X, -40);
    rotate(root, b("UpperArmL"), Z, 18);
    rotate(root, b("LowerArmL"), X, -45);
    rotate(root, b("Head"), Y, 8);
  }
  if (pose === "workBench") {
    rotate(root, b("Abdomen"), X, 10);
    rotate(root, b("Chest"), X, 6);
    rotate(root, b("UpperArmL"), X, -30);
    rotate(root, b("UpperArmR"), X, -30);
    rotate(root, b("LowerArmL"), X, -50);
    rotate(root, b("LowerArmR"), X, -50);
    rotate(root, b("LowerArmL"), Y, -18);
    rotate(root, b("LowerArmR"), Y, 18);
    rotate(root, b("Neck"), X, 16);
  }
  return seated;
}

interface Props {
  model: CharacterModel;
  pose: Pose;
  name: string;
  accent: string;
  active: boolean;
  onActivate: () => void;
  hint?: string;
}

/** A posed CC0 human with a gentle idle, hover ring and a clickable name label. */
export function Character({ model, pose, name, accent, active, onActivate, hint = "Pulsa para hablar" }: Props) {
  const { scene } = useGLTF(CHARACTER_URL[model]);
  const [hovered, setHovered] = useState(false);

  const rig = useMemo(() => {
    const root = cloneSkinned(scene);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    root.scale.setScalar(HEIGHT / Math.max(0.01, size.y));
    root.updateMatrixWorld(true);
    const seated = applyPose(root, pose);
    root.updateMatrixWorld(true);
    const hipsY = root.getObjectByName("Hips")?.getWorldPosition(new THREE.Vector3()).y ?? 0.9;
    root.position.y = seated ? HIPS_SEATED - hipsY : 0;
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        m.frustumCulled = false;
      }
    });
    const chest = root.getObjectByName("Chest");
    const head = root.getObjectByName("Head");
    return {
      root,
      seated,
      chest,
      head,
      chestQ: chest?.quaternion.clone() ?? new THREE.Quaternion(),
      headQ: head?.quaternion.clone() ?? new THREE.Quaternion(),
    };
  }, [scene, pose]);

  const label = useMemo(() => makeLabelTexture(name, hint, accent), [name, hint, accent]);
  const ringMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5, toneMapped: false, depthWrite: false }),
    [accent],
  );
  const labelMat = useMemo(() => new THREE.MeshBasicMaterial({ map: label, transparent: true, toneMapped: false }), [label]);

  useLayoutEffect(
    () => () => {
      label.dispose();
      ringMat.dispose();
      labelMat.dispose();
    },
    [label, ringMat, labelMat],
  );

  const t0 = useRef(Math.random() * 10);
  const tmp = useMemo(() => new THREE.Quaternion(), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime + t0.current;
    if (rig.chest) {
      rig.chest.quaternion.copy(rig.chestQ).multiply(tmp.setFromAxisAngle(X, Math.sin(t * 1.6) * 0.018));
    }
    if (rig.head) {
      rig.head.quaternion.copy(rig.headQ).multiply(tmp.setFromAxisAngle(Y, Math.sin(t * 0.45) * 0.1));
    }
    const target = hovered || active ? 0.95 : 0.35 + Math.sin(t * 2.2) * 0.15;
    ringMat.opacity += (target - ringMat.opacity) * 0.15;
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    setHovered(false);
    document.body.style.cursor = "";
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    onActivate();
  };

  const labelY = rig.seated ? 1.95 : 2.35;
  return (
    <group onPointerOver={over} onPointerOut={out} onClick={click} name={`Personaje: ${name}`}>
      <primitive object={rig.root} />
      {/* generous invisible hit box so the character is easy to tap */}
      <mesh visible={false} position={[0, rig.seated ? 0.75 : 0.9, 0]}>
        <boxGeometry args={[0.9, rig.seated ? 1.5 : 1.8, 0.9]} />
      </mesh>
      <mesh material={ringMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, rig.seated ? 0.25 : 0]}>
        <ringGeometry args={[0.55, 0.72, 48]} />
      </mesh>
      <Billboard position={[0, labelY, 0]}>
        <mesh material={labelMat} scale={hovered ? 1.08 : 1}>
          <planeGeometry args={[2.1, 0.525]} />
        </mesh>
      </Billboard>
    </group>
  );
}

for (const url of Object.values(CHARACTER_URL)) useGLTF.preload(url);
