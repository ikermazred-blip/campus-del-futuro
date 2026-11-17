/** Campus layout in metres. Pure data: no React, no three.js. Front of every building faces +z. */
import type { AssistantId } from "./assistants";

export type FacadeKind = "brick" | "plaster" | "concrete" | "wood" | "stone";
export type RoofKind = "gable" | "flat" | "sawtooth" | "green";
export type WindowStyle = "punched" | "ribbon" | "tall" | "fins";

export interface BuildingSpec {
  id: AssistantId;
  x: number;
  z: number;
  width: number;
  depth: number;
  floors: number;
  floorHeight: number;
  facade: FacadeKind;
  facadeColor: string;
  trimColor: string;
  roof: RoofKind;
  roofColor: string;
  windows: WindowStyle;
  lobbyWidth: number;
  /** Sign/highlight colour */
  accent: string;
  extras: Array<"cupola" | "solar" | "flyTower" | "observatory" | "columns" | "skylights">;
}

export const LOBBY_DEPTH = 3.4;
export const PLINTH = 0.6;

export const BUILDINGS: readonly BuildingSpec[] = [
  {
    id: "profesor-particular",
    x: 0,
    z: -20,
    width: 25,
    depth: 13,
    floors: 3,
    floorHeight: 3.8,
    facade: "brick",
    facadeColor: "#ffffff",
    trimColor: "#ece4d6",
    roof: "gable",
    roofColor: "#8a4a36",
    windows: "punched",
    lobbyWidth: 13,
    accent: "#c2573a",
    extras: ["cupola", "columns"],
  },
  {
    id: "planificador-estudios-tareas",
    x: -31,
    z: -19,
    width: 19,
    depth: 13,
    floors: 3,
    floorHeight: 3.6,
    facade: "plaster",
    facadeColor: "#f3f1ec",
    trimColor: "#d9d6cf",
    roof: "flat",
    roofColor: "#8d8a84",
    windows: "ribbon",
    lobbyWidth: 13,
    accent: "#2f7f8f",
    extras: ["solar"],
  },
  {
    id: "preparador-examenes",
    x: 31,
    z: -19,
    width: 19,
    depth: 13,
    floors: 3,
    floorHeight: 3.6,
    facade: "concrete",
    facadeColor: "#efe6da",
    trimColor: "#c46e4a",
    roof: "flat",
    roofColor: "#8d8a84",
    windows: "fins",
    lobbyWidth: 13,
    accent: "#b4532f",
    extras: [],
  },
  {
    id: "entrenador-exposiciones-orales",
    x: -30,
    z: 17,
    width: 21,
    depth: 14,
    floors: 2,
    floorHeight: 4.4,
    facade: "stone",
    facadeColor: "#efe5d2",
    trimColor: "#b8a88c",
    roof: "flat",
    roofColor: "#8d8a84",
    windows: "tall",
    lobbyWidth: 14,
    accent: "#7a4f8a",
    extras: ["flyTower"],
  },
  {
    id: "asistente-trabajos-proyectos",
    x: 30,
    z: 17,
    width: 20,
    depth: 13,
    floors: 2,
    floorHeight: 4.1,
    facade: "wood",
    facadeColor: "#ffffff",
    trimColor: "#3b3f42",
    roof: "sawtooth",
    roofColor: "#9aa0a3",
    windows: "tall",
    lobbyWidth: 13,
    accent: "#3d7a4a",
    extras: [],
  },
  {
    id: "orientador-academico-profesional",
    x: 0,
    z: 18,
    width: 16,
    depth: 12,
    floors: 2,
    floorHeight: 3.8,
    facade: "plaster",
    facadeColor: "#e9dcc4",
    trimColor: "#9a8a6c",
    roof: "green",
    roofColor: "#6d8a4c",
    windows: "punched",
    lobbyWidth: 12,
    accent: "#2c5d8a",
    extras: ["observatory", "skylights"],
  },
];

export function getBuilding(id: AssistantId): BuildingSpec {
  const b = BUILDINGS.find((s) => s.id === id);
  if (!b) throw new Error(`Unknown building ${id}`);
  return b;
}

/** Seeded PRNG so the campus is identical on every load. */
export function seeded(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TreeSpot {
  x: number;
  z: number;
  scale: number;
  kind: 0 | 1 | 2;
}

const CAMPUS = { minX: -62, maxX: 62, minZ: -36, maxZ: 40 };

function insideBuilding(x: number, z: number, margin: number) {
  return BUILDINGS.some(
    (b) =>
      Math.abs(x - b.x) < b.width / 2 + margin + 0 &&
      z > b.z - b.depth / 2 - margin &&
      z < b.z + b.depth / 2 + LOBBY_DEPTH + margin + 3,
  );
}

export function treeSpots(): TreeSpot[] {
  const r = seeded(7);
  const out: TreeSpot[] = [];
  const add = (x: number, z: number, s = 1, kind?: 0 | 1 | 2) =>
    out.push({ x, z, scale: s * (0.85 + r() * 0.35), kind: kind ?? ((Math.floor(r() * 3) % 3) as 0 | 1 | 2) });

  // Quad lawns
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      add(sx * 10, sz * 4.6, 1.05);
      add(sx * 21, sz * 4.6, 0.95);
    }
  }
  // Front plaza street trees
  for (let x = -54; x <= 54; x += 9) if (Math.abs(x) > 8) add(x, 37.5, 0.9, 1);
  // Gap lawns between front buildings
  add(9.2, 13, 0.85);
  add(17.4, 22, 0.8);
  // Back lawn
  for (let x = -54; x <= 54; x += 7) add(x + (r() - 0.5) * 2, -31 + (r() - 0.5) * 3, 1.05);
  // Sides
  for (let z = -30; z <= 34; z += 8) {
    add(-60, z, 0.9, 0);
    add(60, z, 0.9, 0);
  }
  // Orchard by the garden
  for (let i = 0; i < 6; i++) add(44 + (i % 3) * 6, 19 + Math.floor(i / 3) * 6, 0.65, 2);

  // Outside the campus: scattered neighbourhood trees
  let guard = 0;
  while (out.length < 190 && guard++ < 2000) {
    const x = (r() - 0.5) * 340;
    const z = (r() - 0.5) * 300;
    const inCampus = x > CAMPUS.minX - 14 && x < CAMPUS.maxX + 14 && z > CAMPUS.minZ - 14 && z < CAMPUS.maxZ + 14;
    if (inCampus) continue;
    if (insideHouseLot(x, z)) continue;
    add(x, z, 1 + r() * 0.4);
  }
  return out.filter((t) => !insideBuilding(t.x, t.z, 1.5));
}

export interface House {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  roof: string;
  rot: number;
}

const HOUSE_COLORS = ["#efe6d6", "#e8d8bf", "#f2efe8", "#dcc9ae", "#e6e0d4", "#d9c2a5"];
const ROOF_COLORS = ["#8f4c38", "#6e4a3a", "#5f5f63", "#9b5a40"];

export function houses(): House[] {
  const r = seeded(21);
  const out: House[] = [];
  for (let gx = -6; gx <= 6; gx++) {
    for (let gz = -5; gz <= 5; gz++) {
      const x = gx * 26 + (r() - 0.5) * 6;
      const z = gz * 26 + (r() - 0.5) * 6;
      if (x > CAMPUS.minX - 22 && x < CAMPUS.maxX + 22 && z > CAMPUS.minZ - 22 && z < CAMPUS.maxZ + 22) continue;
      if (r() < 0.25) continue;
      out.push({
        x,
        z,
        w: 8 + r() * 6,
        d: 7 + r() * 4,
        h: 3 + Math.floor(r() * 2) * 3,
        color: HOUSE_COLORS[Math.floor(r() * HOUSE_COLORS.length)] ?? "#efe6d6",
        roof: ROOF_COLORS[Math.floor(r() * ROOF_COLORS.length)] ?? "#8f4c38",
        rot: Math.floor(r() * 2) * (Math.PI / 2),
      });
    }
  }
  return out;
}

function insideHouseLot(x: number, z: number) {
  const gx = Math.round(x / 26);
  const gz = Math.round(z / 26);
  return Math.abs(x - gx * 26) < 9 && Math.abs(z - gz * 26) < 8;
}
