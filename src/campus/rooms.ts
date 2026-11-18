/** Interior rooms and characters (pure data). Local coords: building centre, front faces +z. */
import type { AssistantId } from "./assistants";
import { getBuilding, PLINTH } from "./layout";

export type CharacterModel = "profesor" | "planificadora" | "preparador" | "entrenadora" | "proyectos" | "orientadora";
export type Pose = "sitDesk" | "sitRead" | "present" | "workBench";
export type FloorKind = "floorWood" | "linoleum" | "carpet";

export interface RoomSpec {
  id: AssistantId;
  /** Spanish room name shown in the UI */
  roomName: string;
  floor: FloorKind;
  wallColor: string;
  character: {
    model: CharacterModel;
    pose: Pose;
    x: number;
    z: number;
    rotY: number;
    /** height of the surface the feet stand on (stage) */
    base?: number;
    /** person's role, used in the floating label */
    role: string;
  };
}

export const FLOOR_Y = PLINTH + 0.06;
export const SEAT_HEIGHT = 0.5;

export const ROOMS: Record<AssistantId, RoomSpec> = {
  "profesor-particular": {
    id: "profesor-particular",
    roomName: "Aula",
    floor: "floorWood",
    wallColor: "#efe8da",
    character: { model: "profesor", pose: "sitDesk", x: 0, z: -3.3, rotY: 0, role: "Profesor" },
  },
  "planificador-estudios-tareas": {
    id: "planificador-estudios-tareas",
    roomName: "Sala de organización",
    floor: "linoleum",
    wallColor: "#e7eef0",
    character: { model: "planificadora", pose: "sitDesk", x: 0, z: -2.6, rotY: 0, role: "Planificadora" },
  },
  "preparador-examenes": {
    id: "preparador-examenes",
    roomName: "Biblioteca",
    floor: "floorWood",
    wallColor: "#f1e7d6",
    character: { model: "preparador", pose: "sitRead", x: 0, z: -2.1, rotY: 0, role: "Preparador" },
  },
  "entrenador-exposiciones-orales": {
    id: "entrenador-exposiciones-orales",
    roomName: "Salón de actos",
    floor: "carpet",
    wallColor: "#ece4ef",
    character: { model: "entrenadora", pose: "present", x: 1.4, z: -3.9, rotY: -0.25, base: 0.5, role: "Entrenadora" },
  },
  "asistente-trabajos-proyectos": {
    id: "asistente-trabajos-proyectos",
    roomName: "Laboratorio de proyectos",
    floor: "linoleum",
    wallColor: "#e6eee4",
    character: { model: "proyectos", pose: "workBench", x: 0, z: -2.5, rotY: 0, role: "Asistente" },
  },
  "orientador-academico-profesional": {
    id: "orientador-academico-profesional",
    roomName: "Despacho de orientación",
    floor: "carpet",
    wallColor: "#eef0e6",
    character: { model: "orientadora", pose: "sitDesk", x: 0, z: -2.4, rotY: 0, role: "Orientadora" },
  },
};

/** World position of the character's feet. */
export function characterWorld(id: AssistantId): [number, number, number] {
  const b = getBuilding(id);
  const c = ROOMS[id].character;
  return [b.x + c.x, FLOOR_Y + (c.base ?? 0), b.z + c.z];
}
