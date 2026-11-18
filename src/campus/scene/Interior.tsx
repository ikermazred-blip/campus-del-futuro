import { Suspense, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import type { Assistant } from "../assistants";
import { facadeParts } from "../facade";
import { PLINTH, type BuildingSpec } from "../layout";
import { getMaterials } from "../materials";
import { FLOOR_Y, ROOMS } from "../rooms";
import { getTexture, makePanelTexture, scaledBox, TILE } from "../textures";
import { Character } from "./Character";
import { Furniture } from "./Furniture";
import { InstancedBoxes } from "./InstancedBoxes";
import {
  Books,
  Clock,
  colorMat,
  Curtain,
  Desk,
  Globe,
  Laptop,
  Lectern,
  Monitor,
  Mug,
  OpenBook,
  Papers,
  PencilCup,
  Pegboard,
  Printer3D,
  ProjectModel,
  SeatRows,
  StickyNotes,
  Toolbox,
  WallPanel,
  Workbench,
} from "./props";

interface Props {
  spec: BuildingSpec;
  assistant: Assistant;
  facade: THREE.Material;
  cardOpen: boolean;
  onOpenCard: () => void;
}

const F = FLOOR_Y;
const DESK_H = 0.76;

/** Cut-away ground floor ("dollhouse" section) showing the room and its character. */
export function Interior({ spec, assistant, facade, cardOpen, onOpenCard }: Props) {
  const M = getMaterials();
  const room = ROOMS[spec.id];
  const { width: w, depth: d, floorHeight: fh } = spec;
  const H = fh;
  const backZ = -d / 2 + 0.32;

  const geo = useMemo(
    () => ({
      floor: scaledBox(w - 0.3, 0.06, d - 0.3, TILE[room.floor]),
      back: scaledBox(w, H, 0.3, TILE[spec.facade]),
      side: scaledBox(0.3, H, d, TILE[spec.facade]),
    }),
    [w, d, H, room.floor, spec.facade],
  );
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ map: getTexture(room.floor), roughness: room.floor === "carpet" ? 1 : 0.6 }), [room.floor]);
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: room.wallColor, roughness: 0.92 }), [room.wallColor]);
  const windows = useMemo(
    () => facadeParts({ cx: 0, cz: 0, w, d, floors: 1, fh, style: spec.windows, faces: ["left", "right", "back"] }),
    [w, d, fh, spec.windows],
  );
  const caps = useMemo<Array<[THREE.Vector3Tuple, THREE.Vector3Tuple]>>(
    () => [
      [[0, PLINTH + H + 0.04, -d / 2 + 0.15], [w + 0.02, 0.08, 0.34]],
      [[-w / 2 + 0.15, PLINTH + H + 0.04, 0], [0.34, 0.08, d + 0.02]],
      [[w / 2 - 0.15, PLINTH + H + 0.04, 0], [0.34, 0.08, d + 0.02]],
    ],
    [w, d, H],
  );

  return (
    <group>
      {/* shell */}
      <mesh geometry={geo.floor} material={floorMat} position={[0, F - 0.03, 0]} receiveShadow />
      <mesh geometry={geo.back} material={facade} position={[0, PLINTH + H / 2, -d / 2 + 0.15]} castShadow receiveShadow />
      <mesh geometry={geo.side} material={facade} position={[-w / 2 + 0.15, PLINTH + H / 2, 0]} castShadow receiveShadow />
      <mesh geometry={geo.side} material={facade} position={[w / 2 - 0.15, PLINTH + H / 2, 0]} castShadow receiveShadow />
      <mesh material={wallMat} position={[0, PLINTH + H / 2, -d / 2 + 0.31]} receiveShadow>
        <boxGeometry args={[w - 0.6, H, 0.02]} />
      </mesh>
      <mesh material={wallMat} position={[-w / 2 + 0.31, PLINTH + H / 2, 0]} receiveShadow>
        <boxGeometry args={[0.02, H, d - 0.6]} />
      </mesh>
      <mesh material={wallMat} position={[w / 2 - 0.31, PLINTH + H / 2, 0]} receiveShadow>
        <boxGeometry args={[0.02, H, d - 0.6]} />
      </mesh>
      {caps.map(([p, s], i) => (
        <mesh key={i} material={colorMat("#2b2f31", 0.6)} position={p}>
          <boxGeometry args={s} />
        </mesh>
      ))}
      <InstancedBoxes items={windows.glass.concat(windows.lit)} material={M.glass} castShadow={false} />
      <InstancedBoxes items={windows.frames} material={M.frame} castShadow={false} />
      <pointLight position={[0, PLINTH + H - 0.4, 0]} intensity={18} distance={22} decay={2} color="#ffe9c9" />

      <RoomProps id={spec.id} w={w} d={d} backZ={backZ} />

      <Suspense fallback={null}>
        <group position={[room.character.x, F + (room.character.base ?? 0), room.character.z]} rotation={[0, room.character.rotY, 0]}>
          <Character model={room.character.model} pose={room.character.pose} name={assistant.name} accent={spec.accent} active={cardOpen} onActivate={onOpenCard} />
        </group>
      </Suspense>
    </group>
  );
}

function L({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

function RoomProps({ id, w, d, backZ }: { id: BuildingSpec["id"]; w: number; d: number; backZ: number }) {
  const tex = useMemo(() => {
    switch (id) {
      case "profesor-particular":
        return {
          a: makePanelTexture({ width: 6.4, height: 2, bg: "#2f4a3c", fg: "#f3f1e8", font: "chalk", title: "Ecuaciones de segundo grado", lines: ["ax² + bx + c = 0", "x = ( −b ± √(b² − 4ac) ) / 2a", "Ejemplo: x² − 5x + 6 = 0  →  x = 2, x = 3"] }),
          b: makePanelTexture({ width: 2.2, height: 1.5, bg: "#fbf7ef", fg: "#1f2b27", title: "Hoy en clase", accent: "#c2573a", lines: ["1. Repaso", "2. Ejercicios", "3. Dudas"] }),
        };
      case "planificador-estudios-tareas":
        return {
          a: makePanelTexture({ width: 5, height: 2.2, bg: "#fbfaf6", fg: "#1f2b27", title: "Planificación semanal", planner: true, accent: "#2f7f8f" }),
          b: makePanelTexture({ width: 1.2, height: 0.7, bg: "#1f2b27", fg: "#fbf7ef", title: "Tareas", planner: true }),
        };
      case "preparador-examenes":
        return {
          a: makePanelTexture({ width: 3.4, height: 0.8, bg: "#1f2b27", fg: "#fbf7ef", font: "serif", title: "Biblioteca · Sala de estudio" }),
          b: makePanelTexture({ width: 1.2, height: 0.7, bg: "#fbf7ef", fg: "#1f2b27", title: "Repaso", lines: ["Tema 4 · esquema", "Tarjetas de memoria"] }),
        };
      case "entrenador-exposiciones-orales":
        return {
          a: makePanelTexture({ width: 6, height: 3.2, bg: "#fbf7ef", fg: "#1f2b27", title: "Hablar en público", accent: "#7a4f8a", lines: ["• Respira y haz pausas", "• Mira al público", "• Inicio, desarrollo y cierre", "• Practica en voz alta"] }),
          b: a(),
        };
      case "asistente-trabajos-proyectos":
        return {
          a: makePanelTexture({ width: 3.4, height: 2, bg: "#fbf7ef", fg: "#1f2b27", title: "Proyecto: energía solar", accent: "#3d7a4a", lines: ["1. Investigar", "2. Diseñar", "3. Construir", "4. Presentar"] }),
          b: makePanelTexture({ width: 0.31, height: 0.19, bg: "#e9f1ea", fg: "#1f2b27", title: "Informe" , lines: ["Índice", "Fuentes"] }),
        };
      case "orientador-academico-profesional":
        return {
          a: makePanelTexture({ width: 3.2, height: 1.8, bg: "#fbf7ef", fg: "#1f2b27", font: "serif", title: "Tu futuro", accent: "#2c5d8a", lines: ["Bachillerato", "Formación Profesional", "Universidad", "Mundo laboral"] }),
          b: makePanelTexture({ width: 0.31, height: 0.19, bg: "#eef2f7", fg: "#1f2b27", title: "Itinerarios" }),
        };
    }
    function a() {
      return makePanelTexture({ width: 1, height: 1, bg: "#1f2b27", fg: "#fbf7ef" });
    }
  }, [id]);

  const wallY = PLINTH + 0.06;
  const top = F + DESK_H;

  switch (id) {
    case "profesor-particular": {
      const students: Array<[number, number]> = [];
      for (const sx of [-1, 1]) for (const x of [4.6, 7.4]) for (const z of [0, 2.2, 4.2]) students.push([sx * x, z]);
      return (
        <group>
          <WallPanel p={[0, wallY + 1.85, backZ + 0.03]} w={6.4} h={2} map={tex.a} frame="#6b5137" />
          <WallPanel p={[-6.5, wallY + 1.9, backZ + 0.03]} w={2.2} h={1.5} map={tex.b} />
          <Clock p={[4.5, wallY + 2.75, backZ + 0.04]} />
          <Desk p={[0, F, -2.55]} w={1.9} d={0.85} />
          <Books p={[-0.65, top, -2.6]} n={4} ry={0.2} />
          <OpenBook p={[0.05, top, -2.75]} cover="#8f3b2e" />
          <PencilCup p={[0.62, top, -2.45]} />
          <mesh position={[0.4, top + 0.045, -2.3]} material={colorMat("#b8322a", 0.4)} castShadow>
            <sphereGeometry args={[0.045, 16, 12]} />
          </mesh>
          <L>
            <Furniture model="chair" h={0.95} p={[0, F, -3.45]} />
            <Furniture model="drawer" h={0.85} p={[-3.6, F, backZ + 0.5]} />
            <Furniture model="bookshelf" h={2.2} p={[w / 2 - 0.75, F, -3]} ry={-Math.PI / 2} />
            <Furniture model="plantTall" h={1.3} p={[-w / 2 + 0.9, F, backZ + 0.6]} />
            <Furniture model="plant" h={0.8} p={[w / 2 - 1, F, backZ + 0.6]} />
            {students.map(([x, z], i) => (
              <Furniture key={i} model="chair" h={0.85} p={[x, F, z + 0.55]} ry={Math.PI} />
            ))}
          </L>
          <Globe p={[-3.6, F + 0.85, backZ + 0.5]} />
          {students.map(([x, z], i) => (
            <group key={i}>
              <Desk p={[x, F, z]} w={1.1} d={0.6} h={0.72} panel={false} top={colorMat("#d9c7a5", 0.6)} />
              {i % 3 === 0 && <OpenBook p={[x, F + 0.72, z]} cover="#2f5d73" />}
            </group>
          ))}
        </group>
      );
    }
    case "planificador-estudios-tareas":
      return (
        <group>
          <WallPanel p={[0, wallY + 1.9, backZ + 0.03]} w={5} h={2.2} map={tex.a} />
          <StickyNotes p={[4.3, wallY + 1.9, backZ + 0.03]} w={2.4} h={1.5} />
          <Desk p={[0, F, -1.8]} w={2.1} d={0.9} top={colorMat("#f0ede6", 0.5)} />
          <Monitor p={[-0.6, top, -2.0]} ry={0.55} map={tex.b} />
          <OpenBook p={[0.25, top, -1.95]} cover="#2f7f8f" />
          <Papers p={[0.75, top, -1.75]} n={3} />
          <Mug p={[0.85, top, -2.05]} color="#2f7f8f" />
          <L>
            <Furniture model="chairSoft" h={0.95} p={[0, F, -2.75]} />
            <Furniture model="shelf" h={2.3} p={[-w / 2 + 1.4, F, backZ + 0.45]} />
            <Furniture model="drawer" h={0.85} p={[-3.8, F, backZ + 0.5]} />
            <Furniture model="floorLamp" h={1.6} p={[1.6, F, -3.1]} />
            <Furniture model="plantTall" h={1.3} p={[w / 2 - 0.9, F, backZ + 0.6]} />
            <Furniture model="couch" h={0.85} p={[-w / 2 + 1.3, F, 1.6]} ry={Math.PI / 2} />
            <Furniture model="bin" h={0.4} p={[1.3, F, -1.6]} />
          </L>
          <Books p={[-3.9, F + 0.85, backZ + 0.5]} n={5} />
        </group>
      );
    case "preparador-examenes": {
      const backShelves = [-7, -4.8, 4.8, 7];
      return (
        <group>
          <WallPanel p={[0, wallY + 2.6, backZ + 0.03]} w={3.4} h={0.8} map={tex.a} />
          <Clock p={[0, wallY + 1.7, backZ + 0.04]} />
          <Desk p={[0, F, -1.3]} w={3.2} d={1.2} panel={false} />
          <OpenBook p={[0, top, -1.6]} cover="#3d6b45" />
          <Papers p={[-0.55, top, -1.45]} n={4} />
          <Books p={[-1.2, top, -1.5]} n={5} ry={-0.3} />
          <Books p={[1.15, top, -1.1]} n={3} ry={0.4} />
          <WallPanel p={[0.6, top + 0.02, -1.35]} w={0.5} h={0.32} map={tex.b} ry={0} />
          <Desk p={[0, F, 2.4]} w={3.2} d={1.2} panel={false} />
          <Books p={[0.6, top, 2.3]} n={4} />
          <OpenBook p={[-0.8, top, 2.5]} cover="#8f3b2e" />
          <L>
            <Furniture model="chair" h={0.95} p={[0, F, -2.25]} />
            <Furniture model="deskLamp" h={0.45} p={[1.2, top, -1.6]} ry={-0.6} />
            {backShelves.map((x) => (
              <Furniture key={x} model="shelf" h={2.5} p={[x, F, backZ + 0.45]} />
            ))}
            {[-3.4, -0.8, 1.8].map((z) => (
              <Furniture key={`l${z}`} model="bookshelf" h={2.3} p={[-w / 2 + 0.75, F, z]} ry={Math.PI / 2} />
            ))}
            {[-3.4, -0.8, 1.8].map((z) => (
              <Furniture key={`r${z}`} model="bookshelf" h={2.3} p={[w / 2 - 0.75, F, z]} ry={-Math.PI / 2} />
            ))}
            {[-0.9, 0.9].map((x) => (
              <Furniture key={`a${x}`} model="chair" h={0.95} p={[x, F, 1.55]} />
            ))}
            {[-0.9, 0.9].map((x) => (
              <Furniture key={`b${x}`} model="chair" h={0.95} p={[x, F, 3.25]} ry={Math.PI} />
            ))}
            <Furniture model="plantTall" h={1.3} p={[-2.4, F, backZ + 0.5]} />
          </L>
        </group>
      );
    }
    case "entrenador-exposiciones-orales": {
      const stageZ = backZ + 2.2;
      return (
        <group>
          <mesh material={colorMat("#5b4636", 0.7)} position={[0, F + 0.25, stageZ]} castShadow receiveShadow>
            <boxGeometry args={[12, 0.5, 4.4]} />
          </mesh>
          <mesh material={colorMat("#2b2f31", 0.6)} position={[0, F + 0.51, stageZ + 2.18]}>
            <boxGeometry args={[12, 0.02, 0.06]} />
          </mesh>
          <WallPanel p={[0, wallY + 2.6, backZ + 0.03]} w={6} h={3.2} map={tex.a} frame="#1f2b27" glow={0.25} />
          <Curtain p={[-6.3, F, backZ + 0.3]} h={4} />
          <Curtain p={[6.3, F, backZ + 0.3]} h={4} />
          <Lectern p={[3.3, F + 0.5, -3.6]} ry={-0.35} />
          <SeatRows p={[0, F, 0.4]} rows={4} cols={16} />
          <L>
            <Furniture model="plantTall" h={1.3} p={[-5.2, F + 0.5, stageZ + 1.4]} />
            <Furniture model="plantTall" h={1.3} p={[5.2, F + 0.5, stageZ + 1.4]} />
          </L>
        </group>
      );
    }
    case "asistente-trabajos-proyectos":
      return (
        <group>
          <WallPanel p={[0, wallY + 1.95, backZ + 0.03]} w={3.4} h={2} map={tex.a} />
          <Pegboard p={[-4.6, wallY + 1.9, backZ + 0.03]} w={3} h={1.4} />
          <Workbench p={[0, F, -1.6]} w={3.2} d={1.3} />
          <ProjectModel p={[-0.6, F + 0.92, -1.5]} />
          <Laptop p={[0.55, F + 0.92, -1.75]} ry={Math.PI} map={tex.b} />
          <Toolbox p={[1.3, F + 0.92, -1.3]} ry={0.3} />
          <Printer3D p={[-1.35, F + 0.92, -1.75]} />
          <Papers p={[0.2, F + 0.92, -1.2]} n={3} />
          <Workbench p={[-w / 2 + 2.2, F, 1.4]} w={2.6} d={1.1} />
          <ProjectModel p={[-w / 2 + 2.2, F + 0.92, 1.4]} />
          <L>
            <Furniture model="stool" h={0.75} p={[-0.8, F, -0.55]} />
            <Furniture model="stool" h={0.75} p={[0.8, F, -0.55]} />
            <Furniture model="shelf" h={2.3} p={[w / 2 - 1.5, F, backZ + 0.45]} />
            <Furniture model="drawer" h={0.85} p={[4.2, F, backZ + 0.5]} />
            <Furniture model="plant" h={0.8} p={[-w / 2 + 0.9, F, backZ + 0.6]} />
            <Furniture model="bin" h={0.4} p={[2.1, F, -1.2]} />
          </L>
          <Books p={[4.0, F + 0.85, backZ + 0.5]} n={4} />
        </group>
      );
    case "orientador-academico-profesional":
      return (
        <group>
          <WallPanel p={[0, wallY + 1.95, backZ + 0.03]} w={3.2} h={1.8} map={tex.a} />
          <Desk p={[0, F, -1.6]} w={1.9} d={0.85} />
          <Papers p={[-0.2, top, -1.7]} n={5} />
          <Books p={[-0.7, top, -1.75]} n={4} ry={0.25} />
          <Laptop p={[0.5, top, -1.75]} ry={Math.PI + 0.35} map={tex.b} />
          <PencilCup p={[0.8, top, -1.4]} />
          <L>
            <Furniture model="chairSoft" h={0.95} p={[0, F, -2.55]} />
            <Furniture model="chair" h={0.9} p={[-0.75, F, -0.45]} ry={Math.PI + 0.25} />
            <Furniture model="chair" h={0.9} p={[0.75, F, -0.45]} ry={Math.PI - 0.25} />
            <Furniture model="bookshelf" h={2.2} p={[-3.4, F, backZ + 0.45]} />
            <Furniture model="bookshelf" h={2.2} p={[3.4, F, backZ + 0.45]} />
            <Furniture model="couch" h={0.85} p={[-w / 2 + 1.3, F, 1.8]} ry={Math.PI / 2} />
            <Furniture model="plantTall" h={1.3} p={[w / 2 - 0.9, F, backZ + 0.6]} />
            <Furniture model="floorLamp" h={1.6} p={[-1.6, F, -3.0]} />
          </L>
        </group>
      );
  }
}
