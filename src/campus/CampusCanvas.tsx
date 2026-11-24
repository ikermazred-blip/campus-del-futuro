import { memo, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ASSISTANTS, type AssistantId } from "./assistants";
import { BUILDINGS } from "./layout";
import { Building } from "./scene/Building";

export interface CampusCanvasProps {
  selectedId: AssistantId | null;
  hoveredId: AssistantId | null;
  onSelect: (id: AssistantId) => void;
  onHover: (id: AssistantId | null) => void;
  onReady: () => void;
  onFatal: (message: string) => void;
}

function CameraRig({ selectedId }: { selectedId: AssistantId | null }) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const controls = useThree((state) => state.controls) as unknown as {
    target: THREE.Vector3;
    update: () => void;
    addEventListener: (event: string, callback: () => void) => void;
    removeEventListener: (event: string, callback: () => void) => void;
  } | null;
  const goal = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    if (!controls) return;
    const building = selectedId ? BUILDINGS.find((item) => item.id === selectedId) : undefined;
    goal.current = building
      ? {
          position: new THREE.Vector3(building.x + 24, 17, building.z + 39),
          target: new THREE.Vector3(building.x, 3.2, building.z + 2.5),
        }
      : {
          position: new THREE.Vector3(0, 104, 138),
          target: new THREE.Vector3(0, 2, 0),
        };
  }, [selectedId, controls]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => { goal.current = null; };
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);

  useFrame((_, delta) => {
    if (!controls) return;
    const next = goal.current;
    if (next) {
      const amount = 1 - Math.exp(-2.8 * Math.min(delta, 0.05));
      camera.position.lerp(next.position, amount);
      controls.target.lerp(next.target, amount);
      if (camera.position.distanceTo(next.position) < 0.08 && controls.target.distanceTo(next.target) < 0.08) goal.current = null;
    }
    controls.update();
  });
  return null;
}

function ReadySignal({ onReady, onFatal }: { onReady: () => void; onFatal: (message: string) => void }) {
  const frames = useRef(0);
  const sent = useRef(false);
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onFatal("Se perdió el contexto gráfico del navegador.");
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFatal]);
  useFrame(() => {
    if (sent.current) return;
    frames.current += 1;
    if (frames.current >= 8) {
      sent.current = true;
      onReady();
    }
  });
  return null;
}

const World = memo(function World({
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: Pick<CampusCanvasProps, "selectedId" | "hoveredId" | "onSelect" | "onHover">) {
  return (
    <>
      <mesh position={[0, -0.42, 0]} receiveShadow>
        <boxGeometry args={[158, 0.7, 112]} />
        <meshStandardMaterial color="#78866f" roughness={0.96} />
      </mesh>
      <mesh position={[0, -0.035, -1]} receiveShadow>
        <boxGeometry args={[5.5, 0.08, 83]} />
        <meshStandardMaterial color="#c2c0b5" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.03, 1]} receiveShadow>
        <boxGeometry args={[115, 0.08, 5.5]} />
        <meshStandardMaterial color="#c2c0b5" roughness={0.9} />
      </mesh>
      {BUILDINGS.map((spec) => {
        const assistant = ASSISTANTS.find((item) => item.id === spec.id);
        if (!assistant) return null;
        return (
          <Building
            key={spec.id}
            spec={spec}
            assistant={assistant}
            hovered={hoveredId === spec.id}
            selected={selectedId === spec.id}
            onHover={onHover}
            onSelect={onSelect}
          />
        );
      })}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
        <planeGeometry args={[158, 112]} />
        <meshStandardMaterial color="#809276" roughness={1} />
      </mesh>
    </>
  );
});

export default function CampusCanvas({ selectedId, hoveredId, onSelect, onHover, onReady, onFatal }: CampusCanvasProps) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.6]}
      camera={{ fov: 34, near: 0.1, far: 500, position: [0, 104, 138] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.04;
      }}
      onPointerMissed={() => { document.body.style.cursor = ""; }}
      aria-label="Campus 3D con seis edificios y asistentes humanos interactivos"
    >
      <hemisphereLight args={["#e3edf4", "#68775e", 0.95]} />
      <directionalLight
        position={[55, 78, 38]}
        intensity={3}
        color="#fff0d8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-95}
        shadow-camera-right={95}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <Environment resolution={256} environmentIntensity={0.8}>
        <Lightformer intensity={2} color="#fff3df" position={[10, 12, 8]} scale={[18, 18, 1]} />
        <Lightformer intensity={1} color="#c8d9e8" position={[-12, 6, -6]} rotation-y={Math.PI / 2} scale={[30, 6, 1]} />
      </Environment>
      <color attach="background" args={["#dce4e8"]} />
      <fog attach="fog" args={["#dce4e8", 170, 300]} />
      <World selectedId={selectedId} hoveredId={hoveredId} onSelect={onSelect} onHover={onHover} />
      <OrbitControls
        makeDefault
        target={[0, 2, 0]}
        enableDamping
        dampingFactor={0.08}
        minDistance={18}
        maxDistance={250}
        minPolarAngle={0.25}
        maxPolarAngle={1.42}
        screenSpacePanning={false}
        zoomSpeed={0.8}
      />
      <CameraRig selectedId={selectedId} />
      <ReadySignal onReady={onReady} onFatal={onFatal} />
    </Canvas>
  );
}
