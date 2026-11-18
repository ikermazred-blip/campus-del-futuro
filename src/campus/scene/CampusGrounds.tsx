import { memo } from "react";

/** Shared landscaped base and paved circulation paths connecting the twelve classroom modules. */
export const CampusGrounds = memo(function CampusGrounds() {
  const trees: [number, number][] = [
    [-44, -31], [-44, -10], [-44, 12], [-44, 31],
    [44, -31], [44, -10], [44, 12], [44, 31],
    [-28, -39], [-7, -39], [15, -39], [34, -39],
    [-28, 39], [-7, 39], [15, 39], [34, 39],
  ];
  return (
    <group>
      <mesh position={[0, -0.34, 0]} receiveShadow>
        <boxGeometry args={[96, 0.42, 86]} />
        <meshStandardMaterial color="#71836d" roughness={0.96} />
      </mesh>
      {/* broad stone paths form a legible grid between classroom entrances */}
      {[-20, 0, 20].map((x) => (
        <mesh key={`v-${x}`} position={[x, -0.105, 0]} receiveShadow>
          <boxGeometry args={[1.65, 0.08, 72]} />
          <meshStandardMaterial color="#b8b9b0" roughness={0.92} />
        </mesh>
      ))}
      {[-12, 12].map((z) => (
        <mesh key={`h-${z}`} position={[0, -0.105, z]} receiveShadow>
          <boxGeometry args={[88, 0.08, 2.1]} />
          <meshStandardMaterial color="#b8b9b0" roughness={0.92} />
        </mesh>
      ))}
      {/* green courtyards in the gaps between the classroom wings */}
      {[-10, 10].map((x) => [-12, 12].map((z) => (
        <mesh key={`${x}-${z}`} position={[x, -0.075, z]} receiveShadow>
          <boxGeometry args={[1.4, 0.06, 1.8]} />
          <meshStandardMaterial color="#8b9d79" roughness={0.98} />
        </mesh>
      )))}
      {/* perimeter trees: simple low-poly forms keep the scene lightweight */}
      {trees.map(([x, z], i) => (
        <group key={i} position={[x, -0.1, z]}>
          <mesh position={[0, 1.05, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.24, 2.1, 7]} />
            <meshStandardMaterial color="#765b43" roughness={0.9} />
          </mesh>
          <mesh position={[0, 2.55, 0]} castShadow>
            <icosahedronGeometry args={[1.25, 1]} />
            <meshStandardMaterial color={i % 2 ? "#68866a" : "#78916d"} roughness={0.95} />
          </mesh>
          <mesh position={[0.48, 2.25, 0.28]} castShadow>
            <icosahedronGeometry args={[0.72, 1]} />
            <meshStandardMaterial color="#809a73" roughness={0.95} />
          </mesh>
        </group>
      ))}
      {/* low bollard lights along the paths */}
      {[-20, 0, 20].flatMap((x) => [-31, -12, 12, 31].map((z) => (
        <group key={`lamp-${x}-${z}`} position={[x + 1.35, 0, z]}>
          <mesh position={[0, 0.62, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.08, 1.24, 8]} />
            <meshStandardMaterial color="#59656a" metalness={0.55} roughness={0.45} />
          </mesh>
          <mesh position={[0, 1.28, 0]}>
            <sphereGeometry args={[0.14, 12, 8]} />
            <meshStandardMaterial color="#fff3d6" emissive="#ffe6b5" emissiveIntensity={0.65} />
          </mesh>
        </group>
      )))}
    </group>
  );
});
