import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'
import type { GLTF } from 'three-stdlib'
import type { ThreeElements } from '@react-three/fiber'

type GLTFResult = GLTF & {
  nodes: {
    Plane001: THREE.Mesh
    Plane001_1: THREE.Mesh
  }
  materials: {
    ['Material.003']: THREE.MeshStandardMaterial
    ['Material.004']: THREE.MeshStandardMaterial
  }
}


export function WaterTile(props: ThreeElements['group']) {
  const { nodes, materials } =
    useGLTF('/Modells/kek.glb') as unknown as GLTFResult
  return (
    <group {...props} dispose={null} scale={[3, 3, 3]}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane001.geometry}
        material={materials['Material.003']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane001_1.geometry}
        material={materials['Material.004']}
      />
    </group>
  )
}

useGLTF.preload('/Modells/kek.glb')
