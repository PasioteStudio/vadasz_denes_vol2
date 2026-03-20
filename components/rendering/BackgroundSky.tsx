import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCycle } from "@/lib/contexts";

export function BackgroundSky() {
  const { scene } = useThree();
  const { currentTick, day, night, t } = useCycle();

  // ezt nagyon utálom
  const colors = [
    new THREE.Color("#0d0f18"),
    new THREE.Color("#1a1d2e"),

    new THREE.Color("#3a2a2a"),
    new THREE.Color("#7a3b2a"),

    new THREE.Color("#a55a2a"),
    new THREE.Color("#8c4a2a"),

    new THREE.Color("#7a3b2a"),
    new THREE.Color("#3a2a2a"),

    new THREE.Color("#1a1d2e"),
    new THREE.Color("#0d0f18"),
  ];

  function getSkyColor(t: number) {
    const scaled = t * (colors.length - 1);
    const index = Math.floor(scaled);
    const localT = scaled - index;

    const c1 = colors[index];
    const c2 = colors[Math.min(index + 1, colors.length - 1)];

    return c1.clone().lerp(c2, localT);
  }

  useFrame(() => {
    const total = day + night;

    const progress =
      ((currentTick + t.current) % total) / total;

    const color = getSkyColor(progress);

    scene.background = color;
  });

  return null;
}