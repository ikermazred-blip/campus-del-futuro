import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { SubjectId } from "./subjects";
import { SUBJECTS } from "./subjects";
import { overviewPose } from "./camera";
import { Character } from "./scene/Character";
import { CampusClassroom } from "./scene/CampusClassroom";
import { CampusGrounds } from "./scene/CampusGrounds";
import { CameraRig } from "./scene/CameraRig";

export interface CampusCanvasProps {
  visibleSubjectIds: SubjectId[];
  selectedId: SubjectId | null;
  hoveredId: SubjectId | null;
  resetKey: number;
  onSelect: (id: SubjectId) => void;
  onHover: (id: SubjectId | null) => void;
  onReady: () => void;
  onFatal: (message: string) => void;
}

const SUN: [number, number, number] = [55, 78, 38];
const FOV = 32;

function Lighting() {
  return (
    <>
      <hemisphereLight args={["#dce9f5", "#8c7a5c", 0.85]} />
      <directionalLight
        position={SUN}
        intensity={3.1}
        color="#fff0d8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-78}
        shadow-camera-right={78}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={10}
        shadow-camera-far={260}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      <Environment resolution={256} environmentIntensity={0.75}>
        <color attach="background" args={["#c9d9e4"]} />
        <Lightformer intensity={2.2} color="#fff4e0" position={[10, 12, 8]} scale={[18, 18, 1]} />
        <Lightformer intensity={1.2} color="#bcd6ee" position={[-12, 6, -6]} rotation-y={Math.PI / 2} scale={[30, 6, 1]} />
        <Lightformer intensity={0.8} color="#ffffff" position={[0, 4, -14]} scale={[30, 4, 1]} />
        <Lightformer intensity={0.5} color="#a3b18a" position={[0, -6, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} />
      </Environment>
      <color attach="background" args={["#dce4e8"]} />
      <fog attach="fog" args={["#dce4e8", 125, 260]} />
    </>
  );
}

function ReadySignal({ onReady, onFatal }: { onReady: () => void; onFatal: (m: string) => void }) {
  const frames = useRef(0);
  const done = useRef(false);
  const compiled = useRef(false);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  // Wait until every shader is compiled so the first "ready" frame shows the whole campus.
  useEffect(() => {
    let alive = true;
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .finally(() => {
        if (alive) compiled.current = true;
      });
    return () => {
      alive = false;
    };
  }, [gl, scene, camera]);
  useEffect(() => {
    const el = gl.domElement;
    const lost = (e: Event) => {
      e.preventDefault();
      onFatal("Se perdió el contexto gráfico del navegador.");
    };
    el.addEventListener("webglcontextlost", lost);
    return () => el.removeEventListener("webglcontextlost", lost);
  }, [gl, onFatal]);
  useFrame(() => {
    if (done.current || !compiled.current) return;
    frames.current += 1;
    if (frames.current >= 8) {
      done.current = true;
      onReady();
    }
  });
  return null;
}

const World = memo(function World({
  visibleSubjectIds,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: Pick<CampusCanvasProps, "visibleSubjectIds" | "selectedId" | "hoveredId" | "onSelect" | "onHover">) {
  return (
    <>
      <CampusGrounds />
      {SUBJECTS.filter((subject) => visibleSubjectIds.includes(subject.id)).map((subject) => (
        <group key={subject.id} position={[subject.x, 0.08, subject.z]}>
          <CampusClassroom name={subject.name} accent={subject.accent} />
          <Character
            model={subject.model}
            pose={subject.pose}
            name={subject.name}
            accent={subject.accent}
            active={selectedId === subject.id || hoveredId === subject.id}
            hint="Seleccionar asignatura"
            onActivate={() => onSelect(subject.id)}
          />
        </group>
      ))}
    </>
  );
});

export default function CampusCanvas(props: CampusCanvasProps) {
  const { visibleSubjectIds, selectedId, hoveredId, resetKey, onSelect, onHover, onReady, onFatal } = props;
  const initial = useMemo(() => overviewPose(FOV, window.innerWidth / Math.max(1, window.innerHeight)), []);
  const clearCursor = useCallback(() => {
    document.body.style.cursor = "";
  }, []);
  useEffect(() => clearCursor, [clearCursor]);

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      camera={{ fov: FOV, near: 1, far: 3000, position: initial.position }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl, scene, camera }) => {
        if (import.meta.env.DEV) (window as unknown as { __campus: unknown }).__campus = { scene, camera, gl };
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.02;
      }}
      onPointerMissed={clearCursor}
      aria-label="Campus 3D de SCHOOL AI WORLD con personajes para doce asignaturas"
      role="img"
    >
      <Lighting />
      <World visibleSubjectIds={visibleSubjectIds} selectedId={selectedId} hoveredId={hoveredId} onSelect={onSelect} onHover={onHover} />
      <OrbitControls
        makeDefault
        target={initial.target}
        enableDamping
        dampingFactor={0.08}
        minDistance={22}
        maxDistance={360}
        minPolarAngle={0.35}
        maxPolarAngle={1.22}
        screenSpacePanning={false}
        zoomSpeed={0.8}
      />
      <CameraRig focusId={selectedId} resetKey={resetKey} />
      <ReadySignal onReady={onReady} onFatal={onFatal} />
    </Canvas>
  );
}
