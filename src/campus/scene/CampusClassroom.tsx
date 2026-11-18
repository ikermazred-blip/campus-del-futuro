import { memo } from "react";
import { Text } from "@react-three/drei";

interface Props { name: string; accent: string; }

const Metal = "#59656b";
const Wood = "#987653";

/** Furnished, open-front classroom module so the room and teacher remain visible in the campus view. */
export const CampusClassroom = memo(function CampusClassroom({ name, accent }: Props) {
  return (
    <group>
      {/* raised floor, warm timber finish and perimeter skirting */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <boxGeometry args={[18, 0.24, 18]} />
        <meshStandardMaterial color="#c9c4b7" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[17.65, 0.035, 17.65]} />
        <meshStandardMaterial color="#e0d9c9" roughness={0.88} />
      </mesh>
      {[-6, -3, 0, 3, 6].map((x) => (
        <mesh key={x} position={[x, 0.037, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.018, 17.4]} />
          <meshBasicMaterial color="#c7bdab" transparent opacity={0.48} />
        </mesh>
      ))}
      {/* side and rear walls; the front stays open towards the campus walkway */}
      <mesh position={[0, 2.2, -8.82]} castShadow receiveShadow>
        <boxGeometry args={[18, 4.4, 0.32]} />
        <meshStandardMaterial color="#e9edf0" roughness={0.9} />
      </mesh>
      <mesh position={[-8.82, 2.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.32, 4.4, 17.65]} />
        <meshStandardMaterial color="#e6eaeb" roughness={0.9} />
      </mesh>
      <mesh position={[8.82, 2.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.32, 4.4, 17.65]} />
        <meshStandardMaterial color="#e6eaeb" roughness={0.9} />
      </mesh>
      {/* wide classroom window and architectural frames */}
      <mesh position={[0, 2.55, -8.63]}>
        <boxGeometry args={[7.8, 2.15, 0.06]} />
        <meshPhysicalMaterial color="#9bbdca" metalness={0.08} roughness={0.18} transmission={0.12} transparent opacity={0.78} />
      </mesh>
      {[-3.9, 0, 3.9].map((x) => (
        <mesh key={x} position={[x, 2.55, -8.55]}>
          <boxGeometry args={[0.075, 2.3, 0.1]} />
          <meshStandardMaterial color="#687b84" metalness={0.45} roughness={0.42} />
        </mesh>
      ))}
      <mesh position={[0, 1.47, -8.55]}>
        <boxGeometry args={[7.95, 0.075, 0.1]} />
        <meshStandardMaterial color="#687b84" metalness={0.45} roughness={0.42} />
      </mesh>
      {/* subject identity sign above the window */}
      <mesh position={[0, 3.83, -8.57]} castShadow>
        <boxGeometry args={[8.2, 0.62, 0.16]} />
        <meshStandardMaterial color={accent} roughness={0.56} metalness={0.08} />
      </mesh>
      <Text position={[0, 3.82, -8.47]} fontSize={0.34} maxWidth={7.7} textAlign="center" anchorX="center" anchorY="middle" color="#ffffff" outlineWidth={0.006} outlineColor="#26343b">
        {name.toLocaleUpperCase("es")}
      </Text>
      {/* side wall whiteboard, marker tray and notice panel */}
      <mesh position={[-8.62, 2.45, -1.9]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[5.2, 1.75, 0.08]} />
        <meshStandardMaterial color="#f8faf8" roughness={0.35} metalness={0.05} />
      </mesh>
      <mesh position={[-8.55, 1.53, -1.9]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[5.25, 0.08, 0.16]} />
        <meshStandardMaterial color="#9ca9ad" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[8.62, 2.5, -3.2]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2.5, 1.5, 0.08]} />
        <meshStandardMaterial color="#c7a879" roughness={0.88} />
      </mesh>
      {/* teacher desk: timber top, metal frame, laptop and books */}
      <mesh position={[0, 0.88, 1.55]} castShadow receiveShadow>
        <boxGeometry args={[3.7, 0.16, 1.7]} />
        <meshStandardMaterial color={Wood} roughness={0.58} />
      </mesh>
      {[[-1.62, 0.42, 0.9], [1.62, 0.42, 0.9], [-1.62, 0.42, 2.2], [1.62, 0.42, 2.2]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <boxGeometry args={[0.09, 0.84, 0.09]} />
          <meshStandardMaterial color={Metal} metalness={0.5} roughness={0.48} />
        </mesh>
      ))}
      <mesh position={[0.55, 1.02, 1.45]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[0.82, 0.055, 0.58]} />
        <meshStandardMaterial color="#343c42" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.55, 1.31, 1.7]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[0.78, 0.48, 0.035]} />
        <meshStandardMaterial color="#263d4b" emissive="#24495d" emissiveIntensity={0.18} roughness={0.25} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.78, 1.02 + i * 0.055, 1.48]} rotation={[0, 0, (i % 2 ? -0.04 : 0.04)]}>
          <boxGeometry args={[0.52, 0.045, 0.68]} />
          <meshStandardMaterial color={i === 1 ? "#d8c5a4" : "#f1eee5"} roughness={0.9} />
        </mesh>
      ))}
      {/* chair positioned behind the teacher desk */}
      <mesh position={[0, 0.52, -0.78]} castShadow>
        <boxGeometry args={[1.15, 0.12, 1.05]} />
        <meshStandardMaterial color={accent} roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.05, -1.22]} castShadow>
        <boxGeometry args={[1.15, 1.05, 0.12]} />
        <meshStandardMaterial color={accent} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.26, -0.78]}>
        <boxGeometry args={[0.12, 0.52, 0.12]} />
        <meshStandardMaterial color={Metal} metalness={0.45} roughness={0.5} />
      </mesh>
      {/* two student desks and chairs make the room read as a real classroom */}
      {[-5.2, 5.2].map((x) => (
        <group key={x} position={[x, 0, 4.25]}>
          <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.35, 0.13, 1.35]} />
            <meshStandardMaterial color="#b58d65" roughness={0.68} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 1.02, 0.38, 0]} castShadow>
              <boxGeometry args={[0.09, 0.76, 0.09]} />
              <meshStandardMaterial color={Metal} metalness={0.45} roughness={0.5} />
            </mesh>
          ))}
          <mesh position={[0, 0.48, 1.18]} castShadow>
            <boxGeometry args={[1.05, 0.1, 0.95]} />
            <meshStandardMaterial color="#71818a" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.88, 1.58]} castShadow>
            <boxGeometry args={[1.05, 0.88, 0.1]} />
            <meshStandardMaterial color="#71818a" roughness={0.75} />
          </mesh>
        </group>
      ))}
      {/* ceiling light panels and warm indirect light sources */}
      {[-4.2, 0, 4.2].map((x) => (
        <group key={x}>
          <mesh position={[x, 4.22, 0]}>
            <boxGeometry args={[2.8, 0.055, 1.15]} />
            <meshStandardMaterial color="#fffdf2" emissive="#fff0c9" emissiveIntensity={0.55} roughness={0.3} />
          </mesh>
          <pointLight position={[x, 3.85, 0]} intensity={0.32} distance={9} color="#fff0d8" />
        </group>
      ))}
      {/* small indoor plant in the front corner */}
      <mesh position={[-7.35, 0.55, 6.9]} castShadow>
        <cylinderGeometry args={[0.42, 0.34, 0.72, 12]} />
        <meshStandardMaterial color="#9b7658" roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-7.35 + Math.cos(i * Math.PI / 2) * 0.34, 1.42, 6.9 + Math.sin(i * Math.PI / 2) * 0.34]} rotation={[0, i * Math.PI / 2, 0.25]}>
          <coneGeometry args={[0.34, 1.35, 8]} />
          <meshStandardMaterial color="#66866b" roughness={0.82} />
        </mesh>
      ))}
    </group>
  );
});
