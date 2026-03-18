import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useCycle } from "@/lib/contexts"
import { useThree, useFrame } from "@react-three/fiber";

type SkyType = {
  stopped: boolean;
};

export function Sky({ stopped }: SkyType) {
  const { scene } = useThree();
  const skyRef = useRef<THREE.Mesh | null>(null);
  
  const { currentTick, timeOfDay, day, night, t, direction } = useCycle()

  useEffect(() => {
    const loader = new THREE.TextureLoader();

    loader.load("./textures/Sky.png", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      

      const skyGeo = new THREE.SphereGeometry(400, 32, 32);

      const skyMat = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,
        depthWrite: false,
      });

      const sky = new THREE.Mesh(skyGeo, skyMat);

      skyRef.current = sky;
      scene.add(sky);
    });

    return () => {

      if (skyRef.current) {
        scene.remove(skyRef.current);
      }
    };
  }, [scene]);


useFrame(() => {
    if (!skyRef.current || stopped) return;
    //kiszámoljuk a fordulást úgy mint a fényeknél.
    const duration = timeOfDay === "day" ? day : night;

    const tickInPhase =
      timeOfDay === "day"
        ? currentTick % day
        : currentTick % night;

    const ratio = tickInPhase / duration;

    const angle = ratio * Math.PI * 2;

    skyRef.current.rotation.y = angle;
  });

  return null;
}

export default Sky;