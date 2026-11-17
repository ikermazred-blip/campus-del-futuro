/** Shared materials, created once on the client. */
import * as THREE from "three";
import { getTexture } from "./textures";

let cached: ReturnType<typeof create> | null = null;

function create() {
  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);
  return {
    glass: new THREE.MeshPhysicalMaterial({
      color: "#5f7884",
      metalness: 0.2,
      roughness: 0.06,
      envMapIntensity: 1.6,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    }),
    glassLit: std({
      color: "#8a8677",
      metalness: 0.1,
      roughness: 0.15,
      emissive: new THREE.Color("#ffd49a"),
      emissiveIntensity: 0.55,
    }),
    frame: std({ color: "#33383b", metalness: 0.6, roughness: 0.4 }),
    frameLight: std({ color: "#e9e6df", metalness: 0.2, roughness: 0.5 }),
    concreteDark: std({ map: getTexture("concrete"), color: "#a8a39a", roughness: 0.92 }),
    concrete: std({ map: getTexture("concrete"), color: "#d8d3ca", roughness: 0.9 }),
    metal: std({ color: "#9aa0a4", metalness: 0.7, roughness: 0.35 }),
    darkMetal: std({ color: "#2b2f31", metalness: 0.6, roughness: 0.45 }),
    wood: std({ map: getTexture("wood"), color: "#ffffff", roughness: 0.8 }),
    gravel: std({ map: getTexture("gravel"), roughness: 1 }),
    solar: std({ color: "#1d2d45", metalness: 0.5, roughness: 0.2, envMapIntensity: 1.3 }),
    hedge: std({ map: getTexture("hedge"), roughness: 1 }),
    trunk: std({ color: "#5a4433", roughness: 0.95 }),
    foliage: std({ color: "#ffffff", roughness: 0.85 }),
    water: new THREE.MeshPhysicalMaterial({ color: "#4f7d88", roughness: 0.04, metalness: 0.1, clearcoat: 1, envMapIntensity: 1.8 }),
    lampHead: std({ color: "#fff6e0", emissive: new THREE.Color("#ffe6b0"), emissiveIntensity: 0.4 }),
    white: std({ color: "#f4f1ea", roughness: 0.7 }),
    soil: std({ map: getTexture("soil"), roughness: 1 }),
    house: std({ color: "#ffffff", roughness: 0.9 }),
    houseRoof: std({ color: "#ffffff", roughness: 0.85 }),
  };
}

export function getMaterials() {
  if (!cached) cached = create();
  return cached;
}
