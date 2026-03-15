import React from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

export function Sky() {
  const { scene } = useThree();

  React.useEffect(() => {
    const loader = new THREE.TextureLoader();

    loader.load("./textures/Sky.png", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;


      const skyGeo = new THREE.SphereGeometry(500, 32, 32);

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

export default Sky