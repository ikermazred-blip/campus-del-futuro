/** Camera poses (pure maths). Elevated isometric-style view from the south-east. */
import type { AssistantId } from "./assistants";
import type { SubjectId } from "./subjects";
import { characterWorld } from "./rooms";

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
  const dist = Math.min(360, Math.max(70, halfWidth / halfHorizontalTan(fovDeg, aspect)));
  return along([-2, 0, 4], dist);
}

/** Close view into a building's cut-away ground floor, framing the character. */
export function interiorPose(id: AssistantId, fovDeg: number, aspect: number): Pose {
  const [x, y, z] = characterWorld(id);
  const halfWidth = 6.5;
  const dist = Math.min(28, Math.max(11, halfWidth / halfHorizontalTan(fovDeg, aspect)));
  const az = (10 * Math.PI) / 180;
  const el = (31 * Math.PI) / 180;
  return along([x, y + 0.9, z + 1.6], dist, [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)]);
}


/** Close view of one subject character, keeping the full person and label in frame. */
export function subjectPose(
  id: SubjectId,
  coordinates: { x: number; z: number },
  fovDeg: number,
  aspect: number,
): Pose {
  const halfWidth = 4.2;
  const dist = Math.min(48, Math.max(14, halfWidth / halfHorizontalTan(fovDeg, aspect)));
  const target: [number, number, number] = [coordinates.x, 1.05, coordinates.z];
  const az = (12 * Math.PI) / 180;
  const el = (25 * Math.PI) / 180;
  return along(target, dist, [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)]);
}
