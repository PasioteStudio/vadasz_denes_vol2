import * as THREE from 'three'
import React from 'react'
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

export function NormalTile(props: ThreeElements['group']) {
  const { nodes, materials } =
    useGLTF('/Modells/normalmarssurface.glb') as unknown as GLTFResult

  return (
    //méretét felvettem
    <group {...props} dispose={null} scale={[3, 1, 3]}>
      <mesh
        geometry={nodes.Plane.geometry}
        material={materials['Material.001']}
        receiveShadow
      />
    </group>
  )
}

useGLTF.preload('/Modells/normalmarssurface.glb')