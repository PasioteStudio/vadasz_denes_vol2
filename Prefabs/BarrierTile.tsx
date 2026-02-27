import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'
import type { GLTF } from 'three-stdlib'
import type { ThreeElements } from '@react-three/fiber'
type GLTFResult = GLTF & {
  nodes: {
    Plane_1: THREE.Mesh
    Plane_2: THREE.Mesh
  }
  materials: {
    ['Material.001']: THREE.MeshStandardMaterial
    ['Material.002']: THREE.MeshStandardMaterial
  }
}

export function BarrierTile(props: ThreeElements['group']) {
  const { nodes, materials } =
    useGLTF('/Modells/akadaly.glb') as unknown as GLTFResult
  return (
    <group {...props} dispose={null}  scale={[3, 3, 3]}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane_1.geometry}
        material={materials['Material.001']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane_2.geometry}
        material={materials['Material.002']}
      />
    </group>
  )
}

useGLTF.preload('/Modells/akadaly.glb')