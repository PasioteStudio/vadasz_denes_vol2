import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCycle } from "@/lib/contexts"

export function BackgroundSky() {
  const { scene } = useThree();
  const { currentTick, day, night, t } = useCycle();
//színek
const colors = [
  new THREE.Color("#b3472a"), 
  new THREE.Color("#c28b3c"),
  new THREE.Color("#a8733a"), 
  new THREE.Color("#5a3b2a"), 
  new THREE.Color("#1a1d2e"), 
  new THREE.Color("#b3472a"), 
];

  function getSkyColor(t: number) {
    // const scaled = t * (colors.length - 1);
    // const index = Math.floor(scaled);
    // const localT = scaled - index;

    // const c1 = colors[index];
    // const c2 = colors[Math.min(index + 1, colors.length-1)];

    // return c1.clone().lerp(c2, localT);
    return colors[4]
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