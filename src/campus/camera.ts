/** Camera poses (pure maths). Elevated isometric-style view from the south-east. */
import type { BuildingSpec } from "./layout";
import { footprint, lobbyHeight } from "./facade";

export interface Pose {
  position: [number, number, number];
  target: [number, number, number];
}

const AZIMUTH = (22 * Math.PI) / 180;
const ELEVATION = (36 * Math.PI) / 180;
const DIR: [number, number, number] = [
  Math.sin(AZIMUTH) * Math.cos(ELEVATION),
  Math.sin(ELEVATION),
  Math.cos(AZIMUTH) * Math.cos(ELEVATION),
];

function halfHorizontalTan(fovDeg: number, aspect: number) {
  return Math.tan(((fovDeg * Math.PI) / 180) / 2) * aspect;
}

function along(target: [number, number, number], dist: number, dir = DIR): Pose {
  return {
    target,
    position: [target[0] + dir[0] * dist, target[1] + dir[1] * dist, target[2] + dir[2] * dist],
  };
}

export function overviewPose(fovDeg: number, aspect: number): Pose {
  const halfWidth = 50;
  const dist = Math.min(190, Math.max(70, halfWidth / halfHorizontalTan(fovDeg, aspect)));
  return along([-2, 0, 4], dist);
}

export function focusPose(spec: BuildingSpec, fovDeg: number, aspect: number): Pose {
  const fp = footprint(spec);
  const halfWidth = (fp.maxX - fp.minX) / 2 + 5;
  const dist = Math.min(95, Math.max(32, halfWidth / halfHorizontalTan(fovDeg, aspect)));
  const cx = spec.x + (fp.maxX + fp.minX) / 2;
  const target: [number, number, number] = [cx, lobbyHeight(spec) * 0.6, spec.z + fp.maxZ - 2];
  const az = (14 * Math.PI) / 180;
  const el = (30 * Math.PI) / 180;
  return along(target, dist, [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)]);
}
