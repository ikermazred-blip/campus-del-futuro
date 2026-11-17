import { memo, useMemo } from "react";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { BoxInst } from "../facade";
import { houses, treeSpots } from "../layout";
import { getMaterials } from "../materials";
import { getTexture, makeCampusSignTexture, scaledBox, TILE, type TexKind } from "../textures";
import { InstancedBoxes } from "./InstancedBoxes";

const matCache = new Map<string, THREE.MeshStandardMaterial>();
function surfaceMat(kind: TexKind, color = "#ffffff", roughness = 0.95) {
  const key = `${kind}|${color}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ map: getTexture(kind), color, roughness });
    matCache.set(key, m);
  }
  return m;
}

interface SlabProps {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  top: number;
  h?: number;
  kind: TexKind;
  color?: string;
  shadow?: boolean;
}

/** A flat ground surface (path, lawn, road) as a thin box with world-scaled UVs. */
function Slab({ x0, x1, z0, z1, top, h = 0.1, kind, color, shadow = true }: SlabProps) {
  const w = x1 - x0;
  const d = z1 - z0;
  const geo = useMemo(() => scaledBox(w, h, d, TILE[kind]), [w, h, d, kind]);
  return (
    <mesh geometry={geo} material={surfaceMat(kind, color)} position={[(x0 + x1) / 2, top - h / 2, (z0 + z1) / 2]} receiveShadow={shadow} />
  );
}

function rotXZ(x: number, z: number, ry: number): [number, number] {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  return [x * c + z * s, -x * s + z * c];
}

function benchParts(benches: Array<[number, number, number]>, top: number) {
  const wood: BoxInst[] = [];
  const metal: BoxInst[] = [];
  for (const [bx, bz, ry] of benches) {
    const put = (arr: BoxInst[], lx: number, y: number, lz: number, s: BoxInst["s"], rx = 0) => {
      const [x, z] = rotXZ(lx, lz, ry);
      arr.push({ p: [bx + x, top + y, bz + z], s, r: [rx, ry, 0] });
    };
    for (let i = 0; i < 3; i++) put(wood, 0, 0.45, -0.2 + i * 0.17, [1.9, 0.05, 0.13]);
    put(wood, 0, 0.72, -0.3, [1.9, 0.12, 0.05], -0.18);
    put(wood, 0, 0.88, -0.32, [1.9, 0.12, 0.05], -0.18);
    for (const lx of [-0.8, 0.8]) {
      put(metal, lx, 0.22, 0, [0.07, 0.45, 0.5]);
      put(metal, lx, 0.65, -0.3, [0.07, 0.5, 0.06], -0.18);
    }
  }
  return { wood, metal };
}

function lampParts(lamps: Array<[number, number]>, top: number) {
  const poles: BoxInst[] = [];
  const heads: BoxInst[] = [];
  for (const [x, z] of lamps) {
    poles.push({ p: [x, top + 2, z], s: [0.12, 4, 0.12] });
    poles.push({ p: [x, top + 0.2, z], s: [0.3, 0.4, 0.3] });
    heads.push({ p: [x, top + 4.15, z], s: [0.5, 0.3, 0.5] });
  }
  return { poles, heads };
}

function makeFoliageGeometry(detail: number) {
  const raw = new THREE.IcosahedronGeometry(1, detail);
  raw.deleteAttribute("normal");
  raw.deleteAttribute("uv");
  // Merge the duplicated vertices so normals are smooth instead of faceted.
  const g = mergeVertices(raw);
  const pos = g.attributes['position'] as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const n =
      Math.sin(v.x * 5.1 + v.y * 2.3) * 0.08 +
      Math.sin(v.y * 7.7 + v.z * 3.9) * 0.07 +
      Math.sin(v.z * 11.3 + v.x * 6.1) * 0.05;
    v.multiplyScalar(1 + n);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

const FOLIAGE = ["#4f6f33", "#5b7a37", "#46632e", "#66843c", "#6f8a3f", "#58733a"];

function Trees() {
  const M = getMaterials();
  const { trunks, near, far, nearGeo, farGeo, trunkGeo } = useMemo(() => {
    const spots = treeSpots();
    const trunks: BoxInst[] = [];
    const near: BoxInst[] = [];
    const far: BoxInst[] = [];
    spots.forEach((t, i) => {
      const leaves = Math.abs(t.x) < 64 && t.z > -40 && t.z < 44 ? near : far;
      const s = t.scale;
      const pick = (k: number) => FOLIAGE[(i * 7 + k * 3) % FOLIAGE.length] ?? "#5b7a37";
      if (t.kind === 1) {
        trunks.push({ p: [t.x, 1.6 * s, t.z], s: [0.32 * s, 3.2 * s, 0.32 * s] });
        leaves.push({ p: [t.x, 5.2 * s, t.z], s: [2.1 * s, 3.4 * s, 2.1 * s], c: pick(0) });
        leaves.push({ p: [t.x + 0.4 * s, 3.9 * s, t.z - 0.3 * s], s: [1.7 * s, 1.8 * s, 1.7 * s], c: pick(1) });
      } else if (t.kind === 2) {
        trunks.push({ p: [t.x, 0.9 * s, t.z], s: [0.3 * s, 1.8 * s, 0.3 * s] });
        leaves.push({ p: [t.x, 2.6 * s, t.z], s: [2.1 * s, 1.6 * s, 2.1 * s], c: "#7a9442" });
        leaves.push({ p: [t.x + 0.6 * s, 2.3 * s, t.z + 0.3 * s], s: [1.3 * s, 1.1 * s, 1.3 * s], c: "#86a04a" });
      } else {
        trunks.push({ p: [t.x, 1.5 * s, t.z], s: [0.42 * s, 3 * s, 0.42 * s] });
        leaves.push({ p: [t.x, 4.6 * s, t.z], s: [3.1 * s, 2.7 * s, 3.1 * s], c: pick(0) });
        leaves.push({ p: [t.x + 1.3 * s, 3.9 * s, t.z + 0.6 * s], s: [2.1 * s, 1.9 * s, 2.1 * s], c: pick(1) });
        leaves.push({ p: [t.x - 1.1 * s, 4.1 * s, t.z - 0.8 * s], s: [2.2 * s, 2 * s, 2.2 * s], c: pick(2) });
      }
    });
    return {
      trunks,
      near,
      far,
      nearGeo: makeFoliageGeometry(4),
      farGeo: makeFoliageGeometry(2),
      trunkGeo: new THREE.CylinderGeometry(0.35, 0.5, 1, 7),
    };
  }, []);
  return (
    <>
      <InstancedBoxes items={trunks} material={M.trunk} geometry={trunkGeo} />
      <InstancedBoxes items={near} material={M.foliage} geometry={nearGeo} />
      <InstancedBoxes items={far} material={M.foliage} geometry={farGeo} castShadow={false} />
    </>
  );
}

function Neighbourhood() {
  const M = getMaterials();
  const { walls, roofs, roofGeo } = useMemo(() => {
    const walls: BoxInst[] = [];
    const roofs: BoxInst[] = [];
    for (const h of houses()) {
      const [w, d] = h.rot ? [h.d, h.w] : [h.w, h.d];
      walls.push({ p: [h.x, h.h / 2, h.z], s: [w, h.h, d], c: h.color });
      roofs.push({ p: [h.x, h.h + 1.1, h.z], s: [w * 0.78, 2.2, d * 0.78], r: [0, Math.PI / 4, 0], c: h.roof });
    }
    return { walls, roofs, roofGeo: new THREE.ConeGeometry(1, 1, 4) };
  }, []);
  return (
    <>
      <InstancedBoxes items={walls} material={M.house} castShadow={false} />
      <InstancedBoxes items={roofs} material={M.houseRoof} geometry={roofGeo} castShadow={false} />
    </>
  );
}

function Fountain() {
  const M = getMaterials();
  return (
    <group position={[0, 0.08, 0]}>
      <mesh material={M.concrete} position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.6, 4.8, 0.6, 48]} />
      </mesh>
      <mesh material={M.water} position={[0, 0.52, 0]}>
        <cylinderGeometry args={[4.2, 4.2, 0.1, 48]} />
      </mesh>
      <mesh material={M.concrete} position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.8, 1.2, 24]} />
      </mesh>
      <mesh material={M.concrete} position={[0, 1.65, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.2, 0.2, 32]} />
      </mesh>
      <mesh material={M.water} position={[0, 1.76, 0]}>
        <cylinderGeometry args={[1.35, 1.35, 0.05, 32]} />
      </mesh>
    </group>
  );
}

function EntranceSign() {
  const M = getMaterials();
  const mat = useMemo(() => {
    const t = makeCampusSignTexture();
    return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.25, roughness: 0.6 });
  }, []);
  return (
    <group position={[-15, 0, 38.6]}>
      <mesh material={M.concreteDark} position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[11, 1.8, 0.8]} />
      </mesh>
      <mesh material={mat} position={[0, 1.0, 0.41]}>
        <planeGeometry args={[10, 1.3]} />
      </mesh>
    </group>
  );
}

function Flags() {
  const M = getMaterials();
  const flagMats = useMemo(
    () => ["#c2573a", "#2f6b4f", "#e9dcc4"].map((c) => new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: 0.8 })),
    [],
  );
  return (
    <group position={[8.5, 0, 33.5]}>
      {[-2, 0, 2].map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh material={M.metal} position={[0, 4.6, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 9.2, 8]} />
          </mesh>
          <mesh material={flagMats[i] ?? M.white} position={[0.9, 8.3, 0]} rotation={[0, 0.25, 0]} castShadow>
            <planeGeometry args={[1.8, 1.1]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Court() {
  const M = getMaterials();
  const courtMat = useMemo(() => new THREE.MeshStandardMaterial({ map: getTexture("court"), roughness: 0.8 }), []);
  return (
    <group position={[-50.5, 0, 0]}>
      <mesh material={M.concreteDark} position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[17, 0.1, 31]} />
      </mesh>
      <mesh material={courtMat} position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15.5, 29.5]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0, s * 15]}>
          <mesh material={M.darkMetal} position={[0, 1.6, 0]} castShadow>
            <boxGeometry args={[0.18, 3.2, 0.18]} />
          </mesh>
          <mesh material={M.white} position={[0, 3.2, -s * 0.6]} castShadow>
            <boxGeometry args={[1.8, 1.1, 0.06]} />
          </mesh>
          <mesh material={M.darkMetal} position={[0, 3.25, -s * 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.18, 1.2, 0.06]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Garden() {
  const M = getMaterials();
  const { frames, soil } = useMemo(() => {
    const frames: BoxInst[] = [];
    const soil: BoxInst[] = [];
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        const x = 45.5 + i * 5;
        const z = -10 + j * 8;
        frames.push({ p: [x, 0.25, z], s: [3.2, 0.5, 6.2] });
        soil.push({ p: [x, 0.5, z], s: [2.9, 0.06, 5.9] });
      }
    return { frames, soil };
  }, []);
  return (
    <>
      <Slab x0={42} x1={59} z0={-15} z1={15} top={0.06} kind="gravel" />
      <InstancedBoxes items={frames} material={M.wood} />
      <InstancedBoxes items={soil} material={M.soil} castShadow={false} />
    </>
  );
}

function Hedges() {
  const M = getMaterials();
  const items = useMemo<BoxInst[]>(() => {
    const h = 1.1;
    const seg = (x0: number, x1: number, z0: number, z1: number): BoxInst => ({
      p: [(x0 + x1) / 2, h / 2, (z0 + z1) / 2],
      s: [Math.max(0.9, x1 - x0), h, Math.max(0.9, z1 - z0)],
    });
    return [
      seg(-62, -9, 40, 40),
      seg(9, 62, 40, 40),
      seg(-62, 62, -37, -37),
      seg(-62, -62, -37, 40),
      seg(62, 62, -37, 40),
      // planters around front plaza
      seg(-42, -19.5, 24, 24),
      seg(38.8, 42, 24, 24),
    ];
  }, []);
  return <InstancedBoxes items={items} material={M.hedge} />;
}

function Furniture() {
  const M = getMaterials();
  const { bench, lamp, curbs, planters } = useMemo(() => {
    const benches: Array<[number, number, number]> = [];
    for (const x of [-21, -15, -9, 9, 15, 21]) {
      benches.push([x, 1.25, Math.PI]);
      benches.push([x, -1.25, 0]);
    }
    for (const x of [-34, -24, 24, 34]) benches.push([x, 34, 0]);
    for (const z of [-8, 0, 8]) benches.push([-41, z, Math.PI / 2]);
    const lamps: Array<[number, number]> = [];
    for (let x = -36; x <= 36; x += 12) {
      lamps.push([x, -9]);
      lamps.push([x, 9.5]);
      lamps.push([x + 6, 30.5]);
    }
    const planters: BoxInst[] = [];
    const curbs: BoxInst[] = [];
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const x0 = sx > 0 ? 6 : -25;
        const z0 = sz > 0 ? 2 : -7.5;
        curbs.push({ p: [x0 + 9.5, 0.25, z0 + 2.75], s: [19.4, 0.4, 5.9] });
        planters.push({ p: [x0 + 9.5, 0.47, z0 + 2.75], s: [18.8, 0.06, 5.3] });
      }
    return { bench: benchParts(benches, 0.08), lamp: lampParts(lamps, 0.08), curbs, planters };
  }, []);
  const lawnMat = useMemo(() => new THREE.MeshStandardMaterial({ map: getTexture("lawn", 3.5, 1.1), roughness: 1 }), []);
  return (
    <>
      <InstancedBoxes items={curbs} material={M.concrete} />
      <InstancedBoxes items={planters} material={lawnMat} castShadow={false} />
      <InstancedBoxes items={bench.wood} material={M.wood} />
      <InstancedBoxes items={bench.metal} material={M.darkMetal} />
      <InstancedBoxes items={lamp.poles} material={M.darkMetal} />
      <InstancedBoxes items={lamp.heads} material={M.lampHead} />
    </>
  );
}

function Roads() {
  const dashes = useMemo<BoxInst[]>(() => {
    const out: BoxInst[] = [];
    for (let x = -196; x < 200; x += 8) {
      out.push({ p: [x, 0.045, 48], s: [3, 0.01, 0.18] });
      out.push({ p: [x, 0.045, -44], s: [3, 0.01, 0.18] });
    }
    for (let z = -196; z < 200; z += 8) {
      out.push({ p: [70, 0.045, z], s: [0.18, 0.01, 3] });
      out.push({ p: [-70, 0.045, z], s: [0.18, 0.01, 3] });
    }
    // pedestrian crossing at the entrance
    for (let x = -4; x <= 4; x += 1.2) out.push({ p: [x, 0.045, 48], s: [0.6, 0.01, 7] });
    return out;
  }, []);
  const lineMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#efece4", roughness: 0.7 }), []);
  return (
    <>
      <Slab x0={-200} x1={200} z0={44} z1={52} top={0.04} kind="asphalt" />
      <Slab x0={-200} x1={200} z0={-48} z1={-40} top={0.04} kind="asphalt" />
      <Slab x0={66} x1={74} z0={-200} z1={200} top={0.035} kind="asphalt" />
      <Slab x0={-74} x1={-66} z0={-200} z1={200} top={0.035} kind="asphalt" />
      <Slab x0={-66} x1={66} z0={40.6} z1={44} top={0.16} h={0.2} kind="paving" />
      <Slab x0={-66} x1={66} z0={-40} z1={-37.6} top={0.16} h={0.2} kind="paving" />
      <Slab x0={62.6} x1={66} z0={-40} z1={44} top={0.16} h={0.2} kind="paving" />
      <Slab x0={-66} x1={-62.6} z0={-40} z1={44} top={0.16} h={0.2} kind="paving" />
      <InstancedBoxes items={dashes} material={lineMat} castShadow={false} />
    </>
  );
}

function CampusGroundsImpl() {
  const groundMat = useMemo(() => new THREE.MeshStandardMaterial({ map: getTexture("grass", 1200 / TILE.grass), roughness: 1 }), []);
  return (
    <group>
      <mesh material={groundMat} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
      </mesh>
      {/* campus lawn */}
      <Slab x0={-62} x1={62} z0={-37} z1={40} top={0.03} kind="lawn" />
      {/* quad + plaza + paths */}
      <Slab x0={-42} x1={42} z0={-10} z1={10.5} top={0.08} kind="plaza" />
      <Slab x0={-42} x1={42} z0={24} z1={40.4} top={0.08} kind="plaza" />
      <Slab x0={-8} x1={8} z0={40} z1={44} top={0.17} h={0.2} kind="plaza" />
      <Slab x0={-18.8} x1={-15} z0={10} z1={24.5} top={0.08} kind="paving" />
      <Slab x0={11} x1={15.5} z0={10} z1={24.5} top={0.08} kind="paving" />
      <Slab x0={-42} x1={-40} z0={-14} z1={14} top={0.08} kind="paving" />
      <Slab x0={40} x1={42} z0={-14} z1={14} top={0.08} kind="paving" />
      <Roads />
      <Hedges />
      <Furniture />
      <Fountain />
      <Court />
      <Garden />
      <Flags />
      <EntranceSign />
      <Trees />
      <Neighbourhood />
    </group>
  );
}

export const CampusGrounds = memo(CampusGroundsImpl);
