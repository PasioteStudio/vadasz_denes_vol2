import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";


type SkyType = {
  isDay:boolean
}

export function Sky({isDay}: SkyType ) {
  const { scene } = useThree();

  React.useEffect(() => {
    const loader = new THREE.TextureLoader();

    loader.load("./textures/Sky.png", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = isDay

      const skyGeo = new THREE.SphereGeometry(200, 32, 32);

      const skyMat = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,
      });

      const sky = new THREE.Mesh(skyGeo, skyMat);
      scene.add(sky);
    });

  }, [scene]);

  return null;
}

export default Sky;