import { memo } from "react";
interface Props { accent: string; }

/** Open-front classroom bay: floor, walls, glazing, desk and chair. */
export const CampusClassroom = memo(function CampusClassroom({ accent }: Props) {
  const wall = "#e8edf0";
  const trim = "#aebbc3";
  return (
    <group>
      {/* classroom floor and raised threshold */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <boxGeometry args={[18, 0.24, 18]} />
        <meshStandardMaterial color="#c9c8bd" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[17.5, 0.035, 17.5]} />
        <meshStandardMaterial color="#deded6" roughness={0.9} />
      </mesh>
      {/* back and side walls; front stays open to the campus corridor */}
      <mesh position={[0, 2.15, -8.8]} castShadow receiveShadow>
        <boxGeometry args={[18, 4.3, 0.3]} />
        <meshStandardMaterial color={wall} roughness={0.88} />
      </mesh>
      <mesh position={[-8.8, 2.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 4.3, 17.6]} />
        <meshStandardMaterial color={wall} roughness={0.88} />
      </mesh>
      <mesh position={[8.8, 2.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 4.3, 17.6]} />
        <meshStandardMaterial color={wall} roughness={0.88} />
      </mesh>
      {/* broad rear window with dark frames */}
      <mesh position={[0, 2.65, -8.62]}>
        <boxGeometry args={[8.5, 2.35, 0.08]} />
        <meshStandardMaterial color="#9dbbc9" metalness={0.12} roughness={0.22} transparent opacity={0.72} />
      </mesh>
      {[ -4.3, 0, 4.3 ].map((x) => (
        <mesh key={x} position={[x, 2.65, -8.53]}>
          <boxGeometry args={[0.09, 2.5, 0.12]} />
          <meshStandardMaterial color={trim} metalness={0.45} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 1.43, -8.52]}>
        <boxGeometry args={[8.7, 0.09, 0.12]} />
        <meshStandardMaterial color={trim} metalness={0.4} roughness={0.45} />
      </mesh>
      {/* subject accent panel and room title */}
      <mesh position={[0, 3.72, -8.58]}>
        <boxGeometry args={[5.2, 0.42, 0.1]} />
        <meshStandardMaterial color={accent} roughness={0.6} />
      </mesh>
      {/* teacher desk in front of the seated character */}
      <mesh position={[0, 0.88, 1.55]} castShadow receiveShadow>
        <boxGeometry args={[3.5, 0.16, 1.65]} />
        <meshStandardMaterial color="#98734f" roughness={0.58} />
      </mesh>
      {([[-1.55, 0.42, 0.9], [1.55, 0.42, 0.9], [-1.55, 0.42, 2.2], [1.55, 0.42, 2.2]] as [number, number, number][]).map(([x, y, z], i) => (
        <mesh key={i} position={[x,y,z]} castShadow>
          <boxGeometry args={[0.12, 0.84, 0.12]} />
          <meshStandardMaterial color="#555d63" metalness={0.35} roughness={0.5} />
        </mesh>
      ))}
      {/* chair seat and back behind the character */}
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
        <meshStandardMaterial color="#555d63" metalness={0.45} roughness={0.5} />
      </mesh>
      {/* ceiling light panels */}
      {[-4, 4].map((x) => (
        <mesh key={x} position={[x, 4.22, 0]}>
          <boxGeometry args={[3.8, 0.06, 1.25]} />
          <meshStandardMaterial color="#fffdf2" emissive="#fff2ce" emissiveIntensity={0.35} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
});
