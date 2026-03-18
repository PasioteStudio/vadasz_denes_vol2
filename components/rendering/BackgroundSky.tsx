import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCycle } from "@/lib/contexts"

export function BackgroundSky() {
  const { scene } = useThree();
  const { currentTick, day, night, t } = useCycle();
//színek
  const colors = [
    //sok szín hogy ne legyen zöld átmenet
  new THREE.Color("#ff4d00"), // piros-narancs
  new THREE.Color("#ffcc00"), // sárga
  new THREE.Color("#ff8800"), // narancs
  new THREE.Color("#552200"), // barna átmenet
  new THREE.Color("#0b0f2a"), // sötétkék
  new THREE.Color("#ff4d00"), // vissza
  ];

  function getSkyColor(t: number) {
    const scaled = t * (colors.length - 1);
    const index = Math.floor(scaled);
    const localT = scaled - index;

    const c1 = colors[index];
    const c2 = colors[index + 1];

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