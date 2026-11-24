import { memo, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Assistant, AssistantId } from "../assistants";
import { LOBBY_DEPTH, PLINTH, type BuildingSpec } from "../layout";
import { facadeParts, footprint, lobbyHeight, mainVolume, type BoxInst } from "../facade";
import { getTexture, makeSignTexture, scaledBox, TILE } from "../textures";
import { getMaterials } from "../materials";
import { InstancedBoxes } from "./InstancedBoxes";
import { Interior } from "./Interior";

interface Props {
  spec: BuildingSpec;
  assistant: Assistant;
  hovered: boolean;
  selected: boolean;
  onHover: (id: AssistantId | null) => void;
  onSelect: (id: AssistantId) => void;
}

/** Prism with a triangular profile in the z/y plane, extruded along x. */
function prism(points: Array<[number, number]>, length: number) {
  const shape = new THREE.Shape();
  const [z0, y0] = points[0] ?? [0, 0];
  shape.moveTo(-z0, y0);
  for (const [z, y] of points.slice(1)) shape.lineTo(-z, y);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false });
  g.rotateY(Math.PI / 2);
  g.translate(-length / 2, 0, 0);
  return g;
}

function BuildingImpl({ spec, assistant, hovered, selected, onHover, onSelect }: Props) {
  const M = getMaterials();
  const { width: w, depth: d, floors, floorHeight: fh } = spec;
  const bodyH = floors * fh;
  const roofY = PLINTH + bodyH;
  const lobbyH = lobbyHeight(spec);
  const lw = spec.lobbyWidth;
  const lobbyFront = d / 2 + LOBBY_DEPTH;
  const signH = 3.4;
  const glazeH = lobbyH - signH - 0.7;
  const fp = footprint(spec);

  const mats = useMemo(() => {
    const facade = new THREE.MeshStandardMaterial({
      map: getTexture(spec.facade),
      color: spec.facadeColor,
      roughness: spec.facade === "wood" ? 0.75 : 0.9,
      emissive: new THREE.Color(spec.accent),
      emissiveIntensity: 0,
    });
    const trim = new THREE.MeshStandardMaterial({ color: spec.trimColor, roughness: 0.7 });
    const signTex = makeSignTexture(assistant.number, assistant.name, spec.accent, (lw - 0.6) / signH);
    const sign = new THREE.MeshStandardMaterial({
      map: signTex,
      emissiveMap: signTex,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.3,
      roughness: 0.55,
    });
    const outline = new THREE.MeshBasicMaterial({ color: spec.accent, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
    const roofTiles = new THREE.MeshStandardMaterial({ map: getTexture("roofTiles", 1 / TILE.roofTiles), color: "#ffffff", roughness: 0.85 });
    const metalRoof = new THREE.MeshStandardMaterial({ map: getTexture("metalRoof", 1 / TILE.metalRoof), color: spec.roofColor, roughness: 0.55, metalness: 0.15 });
    const green = new THREE.MeshStandardMaterial({ map: getTexture("lawn", 3, 2), color: "#c9d8a6", roughness: 1 });
    return { facade, trim, sign, outline, roofTiles, metalRoof, green };
  }, [spec, assistant, lw]);

  const geo = useMemo(() => {
    const tile = TILE[spec.facade];
    return {
      body: scaledBox(w, bodyH, d, tile),
      lobby: scaledBox(lw, lobbyH, LOBBY_DEPTH, tile),
      flyTower: scaledBox(w * 0.55, 5, d * 0.5, tile),
      plinth: scaledBox(w + 0.4, PLINTH, d + 0.4, TILE.concrete),
      gable: spec.roof === "gable" ? prism([[-d / 2 - 0.7, 0], [d / 2 + 0.7, 0], [0, d * 0.3]], w + 1.0) : null,
      teeth:
        spec.roof === "sawtooth"
          ? Array.from({ length: 4 }, (_, i) => {
              const td = d / 4;
              const z0 = -d / 2 + i * td;
              return prism([[z0, 0], [z0 + td, 0], [z0, 2.2]], w);
            })
          : [],
    };
  }, [spec, w, d, bodyH, lw, lobbyH, fh]);

  const parts = useMemo(() => {
    const main = facadeParts(mainVolume(spec));
    const extra: BoxInst[] = [];
    // floor bands / cornices
    if (spec.windows === "punched" || spec.windows === "tall") {
      for (let f = 1; f < floors; f++) extra.push({ p: [0, PLINTH + f * fh, 0], s: [w + 0.14, 0.24, d + 0.14] });
    }
    // lobby front glazing
    const lobbyGlass: BoxInst[] = [{ p: [0, PLINTH * 0 + 0.45 + glazeH / 2, lobbyFront + 0.03], s: [lw - 0.8, glazeH, 0.06] }];
    const lobbyFrames: BoxInst[] = [];
    const mullions = Math.round((lw - 0.8) / 1.6);
    for (let i = 0; i <= mullions; i++) {
      const x = -(lw - 0.8) / 2 + (i * (lw - 0.8)) / mullions;
      lobbyFrames.push({ p: [x, 0.45 + glazeH / 2, lobbyFront + 0.07], s: [0.1, glazeH, 0.14] });
    }
    lobbyFrames.push({ p: [0, 0.45 + glazeH, lobbyFront + 0.07], s: [lw - 0.8, 0.12, 0.14] });
    lobbyFrames.push({ p: [0, 0.45 + 2.6, lobbyFront + 0.07], s: [lw - 0.8, 0.08, 0.14] });
    // door handles
    lobbyFrames.push({ p: [-0.25, 1.5, lobbyFront + 0.16], s: [0.05, 0.9, 0.06] }, { p: [0.25, 1.5, lobbyFront + 0.16], s: [0.05, 0.9, 0.06] });
    return { main, extra, lobbyGlass, lobbyFrames };
  }, [spec, w, d, floors, fh, glazeH, lobbyFront, lw]);

  const roofUnits = useMemo<BoxInst[]>(() => {
    if (spec.roof !== "flat") return [];
    const u: BoxInst[] = [
      { p: [-w * 0.25, roofY + 0.7, -d * 0.15], s: [2.4, 1.4, 1.8] },
      { p: [w * 0.18, roofY + 0.55, -d * 0.25], s: [1.6, 1.1, 1.6] },
    ];
    if (!spec.extras.includes("solar")) u.push({ p: [w * 0.3, roofY + 0.9, d * 0.1], s: [1.2, 1.8, 1.2] });
    return u;
  }, [spec, w, d, roofY]);

  const solar = useMemo<BoxInst[]>(() => {
    if (!spec.extras.includes("solar")) return [];
    const out: BoxInst[] = [];
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 2; j++)
        out.push({ p: [-w * 0.05 + i * 2.3, roofY + 0.75, -d * 0.05 + j * 2.6], s: [2.1, 0.08, 1.6], r: [-0.45, 0, 0] });
    return out;
  }, [spec, w, d, roofY]);

  const parapets = useMemo<BoxInst[]>(() => {
    if (spec.roof === "gable" || spec.roof === "sawtooth") return [{ p: [0, roofY + 0.12, 0], s: [w + 0.5, 0.24, d + 0.5] }];
    const h = 0.9;
    const y = roofY + h / 2;
    return [
      { p: [0, y, d / 2 - 0.15], s: [w, h, 0.3] },
      { p: [0, y, -d / 2 + 0.15], s: [w, h, 0.3] },
      { p: [w / 2 - 0.15, y, 0], s: [0.3, h, d] },
      { p: [-w / 2 + 0.15, y, 0], s: [0.3, h, d] },
      // coping
      { p: [0, roofY + h + 0.05, d / 2 - 0.15], s: [w + 0.1, 0.1, 0.45] },
      { p: [0, roofY + h + 0.05, -d / 2 + 0.15], s: [w + 0.1, 0.1, 0.45] },
      { p: [w / 2 - 0.15, roofY + h + 0.05, 0], s: [0.45, 0.1, d] },
      { p: [-w / 2 + 0.15, roofY + h + 0.05, 0], s: [0.45, 0.1, d] },
    ];
  }, [spec, w, d, roofY]);

  const outline = useMemo<BoxInst[]>(() => {
    const minX = fp.minX - 1.6;
    const maxX = fp.maxX + 1.6;
    const minZ = fp.minZ - 1.6;
    const maxZ = fp.maxZ + 2.6;
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const t = 0.45;
    return [
      { p: [cx, 0.12, minZ], s: [maxX - minX, 0.04, t] },
      { p: [cx, 0.12, maxZ], s: [maxX - minX, 0.04, t] },
      { p: [minX, 0.12, cz], s: [t, 0.04, maxZ - minZ] },
      { p: [maxX, 0.12, cz], s: [t, 0.04, maxZ - minZ] },
    ];
  }, [fp]);

  const target = useRef({ facade: 0, sign: 0.3, outline: 0 });
  target.current = {
    facade: hovered ? 0.16 : selected ? 0.09 : 0,
    sign: hovered || selected ? 0.75 : 0.3,
    outline: selected ? 0.95 : hovered ? 0.7 : 0,
  };
  useFrame((_, delta) => {
    const k = 1 - Math.exp(-10 * Math.min(delta, 0.05));
    mats.facade.emissiveIntensity += (target.current.facade - mats.facade.emissiveIntensity) * k;
    mats.sign.emissiveIntensity += (target.current.sign - mats.sign.emissiveIntensity) * k;
    mats.outline.opacity += (target.current.outline - mats.outline.opacity) * k;
    mats.outline.visible = mats.outline.opacity > 0.01;
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(spec.id);
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    onHover(null);
    document.body.style.cursor = "";
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return; // was a drag
    onSelect(spec.id);
  };

  const hasColumns = spec.extras.includes("columns");

  return (
    <group position={[spec.x, 0, spec.z]} onPointerOver={over} onPointerOut={out} onClick={click} name={assistant.name}>
      <group visible={!selected}>
      {/* plinth + body */}
      <mesh geometry={geo.plinth} material={M.concreteDark} position={[0, PLINTH / 2, 0]} castShadow receiveShadow />
      <mesh geometry={geo.body} material={mats.facade} position={[0, PLINTH + bodyH / 2, 0]} castShadow receiveShadow />
      <InstancedBoxes items={parts.extra} material={mats.trim} />
      <InstancedBoxes items={parts.main.glass} material={M.glass} castShadow={false} />
      <InstancedBoxes items={parts.main.lit} material={M.glassLit} castShadow={false} />
      <InstancedBoxes items={parts.main.frames} material={M.frame} castShadow={false} />
      <InstancedBoxes items={parts.main.sills} material={mats.trim} castShadow={false} />
      <InstancedBoxes items={parts.main.fins} material={mats.trim} />
      <InstancedBoxes items={parts.main.spandrels} material={M.frameLight} />

      {/* roof */}
      <InstancedBoxes items={parapets} material={spec.roof === "gable" || spec.roof === "sawtooth" ? mats.trim : M.concrete} />
      {spec.roof === "flat" && (
        <mesh material={M.gravel} position={[0, roofY + 0.06, 0]} receiveShadow>
          <boxGeometry args={[w - 0.4, 0.12, d - 0.4]} />
        </mesh>
      )}
      {spec.roof === "green" && (
        <mesh material={mats.green} position={[0, roofY + 0.12, 0]} receiveShadow>
          <boxGeometry args={[w - 0.4, 0.24, d - 0.4]} />
        </mesh>
      )}
      {spec.roof === "green" && <InstancedBoxes items={parapets.slice(0, 4).map((b) => ({ ...b, s: [b.s[0], 0.5, b.s[2]] as BoxInst["s"], p: [b.p[0], roofY + 0.25, b.p[2]] as BoxInst["p"] }))} material={M.concrete} />}
      {geo.gable && <mesh geometry={geo.gable} material={[mats.facade, mats.roofTiles]} position={[0, roofY + 0.2, 0]} castShadow receiveShadow />}
      {geo.teeth.map((g, i) => (
        <mesh key={i} geometry={g} material={mats.metalRoof} position={[0, roofY + 0.2, 0]} castShadow receiveShadow />
      ))}
      {spec.roof === "sawtooth" && (
        <InstancedBoxes
          items={Array.from({ length: 4 }, (_, i) => ({ p: [0, roofY + 0.2 + 1.05, -d / 2 + (i * d) / 4 - 0.04] as BoxInst["p"], s: [w - 0.4, 1.8, 0.06] as BoxInst["s"] }))}
          material={M.glass}
          castShadow={false}
        />
      )}
      <InstancedBoxes items={roofUnits} material={M.metal} />
      <InstancedBoxes items={solar} material={M.solar} />

      {spec.extras.includes("skylights") && (
        <InstancedBoxes
          items={[-3.5, 0, 3.5].map((x) => ({ p: [x - 1, roofY + 0.5, -1] as BoxInst["p"], s: [2.2, 0.5, 3] as BoxInst["s"] }))}
          material={M.glass}
        />
      )}

      {spec.extras.includes("cupola") && (
        <group position={[0, roofY + 0.2 + d * 0.3 - 0.6, 0]}>
          <mesh material={mats.trim} position={[0, 1.4, 0]} castShadow>
            <boxGeometry args={[3, 2.8, 3]} />
          </mesh>
          <mesh material={M.glass} position={[0, 1.6, 1.52]}>
            <boxGeometry args={[1.6, 1.6, 0.04]} />
          </mesh>
          <mesh material={mats.roofTiles} position={[0, 3.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[2.5, 1.8, 4]} />
          </mesh>
          <mesh material={M.darkMetal} position={[0, 5, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1.4]} />
          </mesh>
        </group>
      )}

      {spec.extras.includes("flyTower") && (
        <group>
          <mesh geometry={geo.flyTower} material={mats.facade} position={[0, roofY + 2.5, -d * 0.2]} castShadow receiveShadow />
          <mesh material={M.concrete} position={[0, roofY + 5.05, -d * 0.2]} castShadow>
            <boxGeometry args={[w * 0.55 + 0.3, 0.12, d * 0.5 + 0.3]} />
          </mesh>
        </group>
      )}

      {spec.extras.includes("observatory") && (
        <group position={[w * 0.22, roofY + 0.24, -d * 0.12]}>
          <mesh material={mats.trim} position={[0, 0.9, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[2.9, 2.9, 1.8, 40]} />
          </mesh>
          <mesh material={M.metal} position={[0, 1.8, 0]} castShadow>
            <sphereGeometry args={[2.7, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh material={M.darkMetal} position={[0, 3.4, 1.1]} rotation={[0.45, 0, 0]}>
            <boxGeometry args={[0.7, 1.6, 0.1]} />
          </mesh>
        </group>
      )}

      {/* entrance lobby */}
      <mesh geometry={geo.lobby} material={mats.facade} position={[0, lobbyH / 2, d / 2 + LOBBY_DEPTH / 2]} castShadow receiveShadow />
      <mesh material={M.concreteDark} position={[0, 0.22, d / 2 + LOBBY_DEPTH / 2 + 0.6]} receiveShadow>
        <boxGeometry args={[lw + 0.6, 0.45, LOBBY_DEPTH + 1.2]} />
      </mesh>
      {[0, 1].map((i) => (
        <mesh key={i} material={M.concrete} position={[0, 0.075 + i * 0.15 - 0.075 * i, lobbyFront + 1.35 + 0.45 * (1 - i)]} receiveShadow>
          <boxGeometry args={[lw * 0.55, 0.15 + 0.15 * i, 0.9]} />
        </mesh>
      ))}
      <InstancedBoxes items={parts.lobbyGlass} material={M.glass} castShadow={false} />
      <InstancedBoxes items={parts.lobbyFrames} material={M.frame} castShadow={false} />
      {/* canopy over the doors */}
      <mesh material={M.white} position={[0, 0.45 + glazeH + 0.25, lobbyFront + 1.1]} castShadow receiveShadow>
        <boxGeometry args={[lw + 1.2, 0.28, 2.3]} />
      </mesh>
      {hasColumns &&
        [-1, 1].flatMap((s) => [s * (lw / 2 + 0.2), s * (lw / 6)]).map((x, i) => (
          <mesh key={i} material={M.white} position={[x, (0.45 + glazeH + 0.25) / 2 + 0.22, lobbyFront + 2.0]} castShadow>
            <cylinderGeometry args={[0.22, 0.26, 0.45 + glazeH + 0.05, 16]} />
          </mesh>
        ))}
      {/* lobby roof slab */}
      <mesh material={M.white} position={[0, lobbyH + 0.15, d / 2 + LOBBY_DEPTH / 2 + 0.15]} castShadow receiveShadow>
        <boxGeometry args={[lw + 0.5, 0.3, LOBBY_DEPTH + 0.6]} />
      </mesh>
      {/* large sign with the full name */}
      <mesh material={mats.sign} position={[0, lobbyH - signH / 2 - 0.2, lobbyFront + 0.06]}>
        <planeGeometry args={[lw - 0.6, signH]} />
      </mesh>
      <mesh material={M.darkMetal} position={[0, lobbyH - signH / 2 - 0.2, lobbyFront + 0.02]}>
        <boxGeometry args={[lw - 0.4, signH + 0.2, 0.06]} />
      </mesh>

      {/* hover / selection outline on the ground */}
      <group position={[0, 0, 0]}>
        <InstancedBoxes items={outline} material={mats.outline} castShadow={false} receiveShadow={false} />
      </group>
      </group>
      {selected && <Interior spec={spec} assistant={assistant} facade={mats.facade} cardOpen={false} onOpenCard={() => onSelect(spec.id)} />}
    </group>
  );
}

export const Building = memo(BuildingImpl);
