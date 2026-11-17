import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { AssistantId } from "../assistants";
import { focusPose, overviewPose } from "../camera";
import { getBuilding } from "../layout";

interface Props {
  focusId: AssistantId | null;
  resetKey: number;
}

/** Smoothly flies the orbit camera to the overview or to the selected building. */
export function CameraRig({ focusId, resetKey }: Props) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const aspectRef = useRef(size.width / Math.max(1, size.height));
  aspectRef.current = size.width / Math.max(1, size.height);

  useEffect(() => {
    if (!controls) return;
    const pose = focusId ? focusPose(getBuilding(focusId), camera.fov, aspectRef.current) : overviewPose(camera.fov, aspectRef.current);
    goal.current = { pos: new THREE.Vector3(...pose.position), target: new THREE.Vector3(...pose.target) };
  }, [focusId, resetKey, controls, camera]);

  useEffect(() => {
    if (!controls) return;
    const cancel = () => {
      goal.current = null;
    };
    controls.addEventListener("start", cancel);
    return () => controls.removeEventListener("start", cancel);
  }, [controls]);

  useFrame((_, delta) => {
    if (!controls) return;
    const g = goal.current;
    if (g) {
      const k = 1 - Math.exp(-3.2 * Math.min(delta, 0.05));
      camera.position.lerp(g.pos, k);
      controls.target.lerp(g.target, k);
      if (camera.position.distanceTo(g.pos) < 0.05 && controls.target.distanceTo(g.target) < 0.05) goal.current = null;
    }
    // keep the view on the campus
    const t = controls.target;
    t.x = THREE.MathUtils.clamp(t.x, -60, 60);
    t.z = THREE.MathUtils.clamp(t.z, -45, 50);
    t.y = THREE.MathUtils.clamp(t.y, 0, 12);
    controls.update();
  });

  return null;
}
