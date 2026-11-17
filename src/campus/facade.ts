/** Pure facade maths: where windows, frames and fins go. No three.js. */
import { LOBBY_DEPTH, PLINTH, type BuildingSpec, type WindowStyle } from "./layout";

export type Vec3 = [number, number, number];
export interface BoxInst {
  p: Vec3;
  s: Vec3;
  r?: Vec3;
  c?: string;
}

export interface FacadeParts {
  glass: BoxInst[];
  lit: BoxInst[];
  frames: BoxInst[];
  sills: BoxInst[];
  fins: BoxInst[];
  spandrels: BoxInst[];
}

export interface Volume {
  cx: number;
  cz: number;
  w: number;
  d: number;
  floors: number;
  fh: number;
  style: WindowStyle;
  /** Skip windows on the front face whose u is inside this range and bottom below `skipBelow`. */
  skipFront?: { from: number; to: number; below: number };
  faces?: Array<"front" | "back" | "left" | "right">;
}

const STYLE = {
  punched: { bay: 3.1, ww: 1.6, wh: 2.0, sill: 0.95 },
  tall: { bay: 3.0, ww: 1.7, wh: 2.9, sill: 0.55 },
  fins: { bay: 2.1, ww: 1.4, wh: 2.5, sill: 0.55 },
  ribbon: { bay: 1.6, ww: 1.6, wh: 2.1, sill: 0.8 },
} as const;

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function facadeParts(v: Volume): FacadeParts {
  const out: FacadeParts = { glass: [], lit: [], frames: [], sills: [], fins: [], spandrels: [] };
  const st = STYLE[v.style];
  const wh = Math.min(st.wh, v.fh - 1.0);
  const faces = v.faces ?? ["front", "back", "left", "right"];
  let idx = 0;

  for (const face of faces) {
    const along = face === "front" || face === "back" ? v.w : v.d;
    const normal = face === "front" || face === "left" ? 1 : -1;
    const isZ = face === "front" || face === "back";
    const offset = (isZ ? v.d : v.w) / 2;

    // place(u, y, sizeU, sizeY, thickness, out)
    const place = (u: number, y: number, su: number, sy: number, t: number, push: (b: BoxInst) => void) => {
      const n = offset + t / 2;
      if (isZ) push({ p: [v.cx + u, y, v.cz + normal * n], s: [su, sy, t] });
      else push({ p: [v.cx + (face === "left" ? -n : n), y, v.cz + u], s: [t, sy, su] });
    };

    const margin = v.style === "ribbon" ? 0.7 : 1.0;
    const usable = along - margin * 2;
    const cols = Math.max(1, Math.floor(usable / st.bay));
    const start = -((cols - 1) * st.bay) / 2;

    for (let f = 0; f < v.floors; f++) {
      const floorY = PLINTH + f * v.fh;
      const bottom = floorY + st.sill;
      const cy = bottom + wh / 2;

      if (v.style === "ribbon") {
        // continuous glass band with spandrel above
        place(0, cy, usable, wh, 0.06, (b) => out.glass.push(b));
        place(0, floorY + v.fh - 0.25, along + 0.06, 0.5, 0.1, (b) => out.spandrels.push(b));
        for (let i = 0; i <= cols; i++) {
          const u = start - st.bay / 2 + i * st.bay;
          place(u, cy, 0.08, wh, 0.14, (b) => out.frames.push(b));
        }
        place(0, cy + wh / 2, usable, 0.08, 0.14, (b) => out.frames.push(b));
        place(0, cy - wh / 2, usable, 0.08, 0.14, (b) => out.frames.push(b));
        continue;
      }

      for (let i = 0; i < cols; i++) {
        const u = start + i * st.bay;
        if (
          face === "front" &&
          v.skipFront &&
          u + st.ww / 2 > v.skipFront.from &&
          u - st.ww / 2 < v.skipFront.to &&
          bottom < v.skipFront.below
        )
          continue;
        idx++;
        const lit = hash(idx + v.cx * 3.1 + v.cz) < 0.2;
        place(u, cy, st.ww, wh, 0.05, (b) => (lit ? out.lit : out.glass).push(b));
        // frame
        place(u, cy + wh / 2, st.ww + 0.12, 0.1, 0.14, (b) => out.frames.push(b));
        place(u, cy - wh / 2, st.ww + 0.12, 0.1, 0.14, (b) => out.frames.push(b));
        place(u - st.ww / 2, cy, 0.1, wh, 0.14, (b) => out.frames.push(b));
        place(u + st.ww / 2, cy, 0.1, wh, 0.14, (b) => out.frames.push(b));
        if (st.ww > 1.45) place(u, cy, 0.06, wh, 0.1, (b) => out.frames.push(b));
        if (v.style === "tall") place(u, cy + wh * 0.22, st.ww, 0.06, 0.1, (b) => out.frames.push(b));
        place(u, bottom - 0.06, st.ww + 0.3, 0.1, 0.3, (b) => out.sills.push(b));
      }

      if (v.style === "fins" && f === 0) {
        for (let i = 0; i <= cols; i++) {
          const u = start - st.bay / 2 + i * st.bay;
          const h = v.floors * v.fh;
          place(u, PLINTH + h / 2, 0.22, h, 0.7, (b) => out.fins.push(b));
        }
      }
    }
  }
  return out;
}

export function mainVolume(spec: BuildingSpec): Volume {
  const lobbyH = lobbyHeight(spec);
  return {
    cx: 0,
    cz: 0,
    w: spec.width,
    d: spec.depth,
    floors: spec.floors,
    fh: spec.floorHeight,
    style: spec.windows,
    skipFront: { from: -spec.lobbyWidth / 2 - 0.4, to: spec.lobbyWidth / 2 + 0.4, below: lobbyH + 0.2 },
  };
}

export function lobbyHeight(spec: BuildingSpec) {
  return Math.max(spec.floorHeight + 3.5, 7.2);
}

export function footprint(spec: BuildingSpec) {
  const towerExtra = 0;
  return {
    minX: -spec.width / 2 - towerExtra,
    maxX: spec.width / 2,
    minZ: -spec.depth / 2,
    maxZ: spec.depth / 2 + LOBBY_DEPTH,
  };
}
