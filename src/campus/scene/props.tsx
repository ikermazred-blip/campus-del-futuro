/** Small procedural props for the interiors (desks, books, boards, screens…). */
import { useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { getMaterials } from "../materials";
import type { BoxInst } from "../facade";
import { InstancedBoxes } from "./InstancedBoxes";

type V3 = [number, number, number];

const matCache = new Map<string, THREE.MeshStandardMaterial>();
export function colorMat(color: string, roughness = 0.7, metalness = 0) {
  const key = `${color}|${roughness}|${metalness}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    matCache.set(key, m);
  }
  return m;
}

function Box({ p, s, m, r }: { p: V3; s: V3; m: THREE.Material; r?: V3 }) {
  return (
    <mesh position={p} rotation={r ?? [0, 0, 0]} material={m} castShadow receiveShadow>
      <boxGeometry args={s} />
    </mesh>
  );
}

export function Group({ p, ry = 0, children }: { p: V3; ry?: number; children: ReactNode }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {children}
    </group>
  );
}

/** Desk. Local origin on the floor; the modesty panel faces +z. */
export function Desk({ p, ry = 0, w = 1.6, d = 0.8, h = 0.76, panel = true, top }: { p: V3; ry?: number; w?: number; d?: number; h?: number; panel?: boolean; top?: THREE.Material }) {
  const M = getMaterials();
  const legs = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => [sx * (w / 2 - 0.06), sz * (d / 2 - 0.06)] as const));
  return (
    <Group p={p} ry={ry}>
      <Box p={[0, h - 0.025, 0]} s={[w, 0.05, d]} m={top ?? M.wood} />
      {legs.map(([x, z], i) => (
        <Box key={i} p={[x, (h - 0.05) / 2, z]} s={[0.05, h - 0.05, 0.05]} m={M.darkMetal} />
      ))}
      {panel && <Box p={[0, h * 0.55, d / 2 - 0.08]} s={[w - 0.12, h * 0.6, 0.03]} m={top ?? M.wood} />}
    </Group>
  );
}

const BOOK_COLORS = ["#8f3b2e", "#2f5d73", "#3d6b45", "#c49a3a", "#5a4a7a", "#b65a36", "#2b3f5c"];

export function Books({ p, n = 3, ry = 0 }: { p: V3; n?: number; ry?: number }) {
  const items = useMemo<BoxInst[]>(
    () =>
      Array.from({ length: n }, (_, i) => ({
        p: [((i * 37) % 7) * 0.006, 0.02 + i * 0.042, ((i * 13) % 5) * 0.005] as V3,
        s: [0.28 - (i % 3) * 0.02, 0.04, 0.2 - (i % 2) * 0.02] as V3,
        r: [0, (i % 3) * 0.12 - 0.1, 0] as V3,
        c: BOOK_COLORS[(i * 3 + n) % BOOK_COLORS.length] ?? "#8f3b2e",
      })),
    [n],
  );
  return (
    <Group p={p} ry={ry}>
      <InstancedBoxes items={items} material={getMaterials().foliage} />
    </Group>
  );
}

export function OpenBook({ p, ry = 0, cover = "#2f5d73" }: { p: V3; ry?: number; cover?: string }) {
  return (
    <Group p={p} ry={ry}>
      <Box p={[0, 0.008, 0]} s={[0.44, 0.016, 0.3]} m={colorMat(cover)} />
      <Box p={[-0.105, 0.022, 0]} s={[0.2, 0.014, 0.28]} r={[0, 0, 0.05]} m={colorMat("#f7f3ea", 0.9)} />
      <Box p={[0.105, 0.022, 0]} s={[0.2, 0.014, 0.28]} r={[0, 0, -0.05]} m={colorMat("#f7f3ea", 0.9)} />
    </Group>
  );
}

export function Papers({ p, n = 4, ry = 0 }: { p: V3; n?: number; ry?: number }) {
  return (
    <Group p={p} ry={ry}>
      {Array.from({ length: n }, (_, i) => (
        <Box key={i} p={[i * 0.03, 0.002 + i * 0.002, i * 0.02]} s={[0.21, 0.002, 0.297]} r={[0, i * 0.18 - 0.2, 0]} m={colorMat("#fbfaf6", 0.95)} />
      ))}
    </Group>
  );
}

export function Mug({ p, color = "#c2573a" }: { p: V3; color?: string }) {
  return (
    <mesh position={[p[0], p[1] + 0.05, p[2]]} material={colorMat(color, 0.4)} castShadow>
      <cylinderGeometry args={[0.045, 0.04, 0.1, 16]} />
    </mesh>
  );
}

export function PencilCup({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <mesh position={[0, 0.06, 0]} material={colorMat("#33383b", 0.5, 0.4)} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.12, 16]} />
      </mesh>
      {["#d9a33a", "#c2573a", "#2f5d73"].map((c, i) => (
        <mesh key={c} position={[(i - 1) * 0.015, 0.14, (i % 2) * 0.01]} rotation={[0.1 * (i - 1), 0, 0.12 * (i - 1)]} material={colorMat(c)}>
          <cylinderGeometry args={[0.005, 0.005, 0.16, 6]} />
        </mesh>
      ))}
    </group>
  );
}

/** A framed board/screen on a wall. Local origin at its centre, front faces +z. */
export function WallPanel({ p, w, h, map, ry = 0, frame = "#3b3f42", glow = 0 }: { p: V3; w: number; h: number; map: THREE.Texture; ry?: number; frame?: string; glow?: number }) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map,
        roughness: 0.75,
        emissiveMap: glow ? map : null,
        emissive: new THREE.Color(glow ? "#ffffff" : "#000000"),
        emissiveIntensity: glow,
      }),
    [map, glow],
  );
  return (
    <Group p={p} ry={ry}>
      <Box p={[0, 0, 0]} s={[w + 0.12, h + 0.12, 0.05]} m={colorMat(frame, 0.5, 0.3)} />
      <mesh position={[0, 0, 0.03]} material={mat}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </Group>
  );
}

export function Monitor({ p, ry = 0, map }: { p: V3; ry?: number; map: THREE.Texture }) {
  const M = getMaterials();
  const screen = useMemo(() => new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.7 }), [map]);
  return (
    <Group p={p} ry={ry}>
      <Box p={[0, 0.01, 0]} s={[0.22, 0.02, 0.18]} m={M.darkMetal} />
      <Box p={[0, 0.16, -0.03]} s={[0.04, 0.28, 0.03]} m={M.darkMetal} />
      <Box p={[0, 0.42, 0]} s={[0.62, 0.38, 0.03]} m={M.darkMetal} />
      <mesh position={[0, 0.42, 0.017]} material={screen}>
        <planeGeometry args={[0.58, 0.34]} />
      </mesh>
      <Box p={[0, 0.012, 0.32]} s={[0.44, 0.02, 0.14]} m={colorMat("#e4e2dc", 0.6)} />
    </Group>
  );
}

export function Laptop({ p, ry = 0, map }: { p: V3; ry?: number; map: THREE.Texture }) {
  const M = getMaterials();
  const screen = useMemo(() => new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.6 }), [map]);
  return (
    <Group p={p} ry={ry}>
      <Box p={[0, 0.01, 0]} s={[0.34, 0.02, 0.24]} m={M.metal} />
      <group position={[0, 0.02, -0.12]} rotation={[-0.3, 0, 0]}>
        <Box p={[0, 0.11, 0]} s={[0.34, 0.22, 0.012]} m={M.metal} />
        <mesh position={[0, 0.11, 0.007]} material={screen}>
          <planeGeometry args={[0.31, 0.19]} />
        </mesh>
      </group>
    </Group>
  );
}

export function Globe({ p }: { p: V3 }) {
  const M = getMaterials();
  return (
    <group position={p}>
      <Box p={[0, 0.02, 0]} s={[0.18, 0.04, 0.18]} m={M.darkMetal} />
      <mesh position={[0, 0.16, 0]} material={M.darkMetal}>
        <cylinderGeometry args={[0.012, 0.012, 0.24, 6]} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[0, 0, 0.4]} material={colorMat("#3f7ea6", 0.5)} castShadow>
        <sphereGeometry args={[0.15, 24, 16]} />
      </mesh>
      <mesh position={[0.03, 0.33, 0.07]} material={colorMat("#7aa05a", 0.8)}>
        <sphereGeometry args={[0.1, 12, 8]} />
      </mesh>
    </group>
  );
}

export function Lectern({ p, ry = 0 }: { p: V3; ry?: number }) {
  const M = getMaterials();
  return (
    <Group p={p} ry={ry}>
      <Box p={[0, 0.55, 0]} s={[0.55, 1.1, 0.42]} m={M.wood} />
      <Box p={[0, 1.15, -0.02]} s={[0.66, 0.05, 0.5]} r={[0.28, 0, 0]} m={M.wood} />
      <Box p={[0, 1.18, 0.02]} s={[0.21, 0.01, 0.297]} r={[0.28, 0, 0]} m={colorMat("#fbfaf6", 0.95)} />
      <mesh position={[0.18, 1.32, 0.1]} rotation={[0.6, 0, 0]} material={M.darkMetal}>
        <cylinderGeometry args={[0.008, 0.008, 0.35, 6]} />
      </mesh>
    </Group>
  );
}

/** Rows of auditorium seats facing -z. */
export function SeatRows({ p, rows, cols, dx = 0.72, dz = 1.15, aisle = 1.2, color = "#6c3e5e" }: { p: V3; rows: number; cols: number; dx?: number; dz?: number; aisle?: number; color?: string }) {
  const { fabric, frame } = useMemo(() => {
    const fabric: BoxInst[] = [];
    const frame: BoxInst[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const half = cols / 2;
        const xi = c - half + 0.5;
        const x = xi * dx + Math.sign(xi) * (aisle / 2);
        const z = r * dz;
        fabric.push({ p: [x, 0.45, z], s: [0.56, 0.1, 0.5] });
        fabric.push({ p: [x, 0.78, z + 0.24], s: [0.56, 0.62, 0.08], r: [0.12, 0, 0] });
        frame.push({ p: [x - 0.32, 0.32, z + 0.05], s: [0.06, 0.64, 0.55] });
      }
      const xEnd = (cols / 2 - 0.5) * dx + aisle / 2 + 0.32;
      frame.push({ p: [xEnd, 0.32, r * dz + 0.05], s: [0.06, 0.64, 0.55] });
      frame.push({ p: [-xEnd + 0.64, 0.32, r * dz + 0.05], s: [0.06, 0.64, 0.55] });
    }
    return { fabric, frame };
  }, [rows, cols, dx, dz, aisle]);
  return (
    <group position={p}>
      <InstancedBoxes items={fabric} material={colorMat(color, 0.95)} />
      <InstancedBoxes items={frame} material={getMaterials().darkMetal} />
    </group>
  );
}

export function Workbench({ p, w = 3, d = 1.2, h = 0.92 }: { p: V3; w?: number; d?: number; h?: number }) {
  const M = getMaterials();
  return (
    <group position={p}>
      <Box p={[0, h - 0.03, 0]} s={[w, 0.06, d]} m={M.wood} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => [sx, sz] as const)).map(([sx, sz], i) => (
        <Box key={i} p={[sx * (w / 2 - 0.08), (h - 0.06) / 2, sz * (d / 2 - 0.08)]} s={[0.07, h - 0.06, 0.07]} m={M.darkMetal} />
      ))}
      <Box p={[0, 0.22, 0]} s={[w - 0.2, 0.04, d - 0.2]} m={M.wood} />
    </group>
  );
}

export function StickyNotes({ p, w, h, ry = 0 }: { p: V3; w: number; h: number; ry?: number }) {
  const notes = useMemo<BoxInst[]>(() => {
    const colors = ["#f3d36b", "#f4a3a3", "#9fd3c7", "#b8d27a", "#f6c28b"];
    const out: BoxInst[] = [];
    for (let i = 0; i < 14; i++) {
      const x = -w / 2 + 0.2 + ((i * 0.37) % (w - 0.4));
      const y = -h / 2 + 0.2 + ((i * 0.53) % (h - 0.4));
      out.push({ p: [x, y, 0.035], s: [0.16, 0.16, 0.005], r: [0, 0, ((i % 5) - 2) * 0.06], c: colors[i % colors.length] ?? "#f3d36b" });
    }
    return out;
  }, [w, h]);
  return (
    <Group p={p} ry={ry}>
      <Box p={[0, 0, 0]} s={[w, h, 0.04]} m={colorMat("#b88a5a", 0.95)} />
      <InstancedBoxes items={notes} material={getMaterials().foliage} castShadow={false} />
    </Group>
  );
}

export function Pegboard({ p, w, h }: { p: V3; w: number; h: number }) {
  const tools = useMemo<BoxInst[]>(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        p: [-w / 2 + 0.3 + (i % 5) * ((w - 0.6) / 4), (i < 5 ? 0.3 : -0.3), 0.05] as V3,
        s: [0.06 + (i % 3) * 0.05, 0.35 + (i % 2) * 0.12, 0.04] as V3,
        c: ["#c2573a", "#33383b", "#d9a33a", "#2f5d73"][i % 4] ?? "#33383b",
      })),
    [w],
  );
  return (
    <group position={p}>
      <Box p={[0, 0, 0]} s={[w, h, 0.03]} m={colorMat("#d8c3a0", 0.9)} />
      <InstancedBoxes items={tools} material={getMaterials().foliage} castShadow={false} />
    </group>
  );
}

/** Cardboard architecture model, solar panel and tool box for the projects lab. */
export function ProjectModel({ p }: { p: V3 }) {
  const M = getMaterials();
  const card = colorMat("#c9a172", 0.9);
  return (
    <group position={p}>
      <Box p={[0, 0.01, 0]} s={[0.7, 0.02, 0.5]} m={colorMat("#e9e2d2", 0.9)} />
      <Box p={[-0.15, 0.1, -0.05]} s={[0.22, 0.18, 0.2]} m={card} />
      <Box p={[0.12, 0.07, 0.08]} s={[0.18, 0.12, 0.16]} m={card} />
      <Box p={[0.12, 0.15, 0.08]} s={[0.2, 0.02, 0.18]} r={[-0.5, 0, 0]} m={M.solar} />
      <Box p={[0.22, 0.04, -0.15]} s={[0.12, 0.06, 0.1]} m={colorMat("#7aa05a", 0.9)} />
    </group>
  );
}

export function Toolbox({ p, ry = 0 }: { p: V3; ry?: number }) {
  return (
    <Group p={p} ry={ry}>
      <Box p={[0, 0.08, 0]} s={[0.45, 0.16, 0.22]} m={colorMat("#b83a2e", 0.5, 0.3)} />
      <Box p={[0, 0.19, 0]} s={[0.25, 0.03, 0.03]} m={getMaterials().darkMetal} />
    </Group>
  );
}

export function Printer3D({ p }: { p: V3 }) {
  const M = getMaterials();
  return (
    <group position={p}>
      <Box p={[0, 0.03, 0]} s={[0.45, 0.06, 0.45]} m={M.darkMetal} />
      <Box p={[-0.2, 0.25, 0]} s={[0.04, 0.45, 0.04]} m={M.darkMetal} />
      <Box p={[0.2, 0.25, 0]} s={[0.04, 0.45, 0.04]} m={M.darkMetal} />
      <Box p={[0, 0.47, 0]} s={[0.44, 0.04, 0.06]} m={M.darkMetal} />
      <Box p={[0, 0.1, 0]} s={[0.12, 0.08, 0.12]} m={colorMat("#d9a33a", 0.5)} />
    </group>
  );
}

export function Clock({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={colorMat("#fbfaf6", 0.5)}>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 32]} />
      </mesh>
      <mesh position={[0, 0.05, 0.025]} material={colorMat("#1f2b27")}>
        <boxGeometry args={[0.02, 0.14, 0.01]} />
      </mesh>
      <mesh position={[0.04, 0, 0.025]} rotation={[0, 0, -1.2]} material={colorMat("#1f2b27")}>
        <boxGeometry args={[0.02, 0.1, 0.01]} />
      </mesh>
    </group>
  );
}

export function Curtain({ p, h }: { p: V3; h: number }) {
  return <Box p={[p[0], p[1] + h / 2, p[2]]} s={[0.9, h, 0.25]} m={colorMat("#7a2633", 0.95)} />;
}
