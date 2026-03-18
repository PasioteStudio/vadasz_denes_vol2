import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import type { GLTF } from 'three-stdlib'
import type { ThreeElements } from '@react-three/fiber'

type GLTFResult = GLTF & {
  nodes: {
    Plane: THREE.Mesh
  }
  materials: {
    ['Material.001']: THREE.MeshStandardMaterial
  }
}

export function NormalTile2(props: ThreeElements['group']) {
  const { nodes, materials } =
    useGLTF('/Modells/normalmarssurface2.glb') as unknown as GLTFResult

  return (
    //méret
    <group {...props} dispose={null} scale={[1, 1, 1]}>
      <mesh
        geometry={nodes.Plane.geometry}
        material={materials['Material.001']}
        receiveShadow
      />
    </group>
  )
}

useGLTF.preload('/Modells/normalmarssurface2.glb')