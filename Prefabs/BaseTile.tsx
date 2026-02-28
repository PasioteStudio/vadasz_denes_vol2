import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'
import type { GLTF } from 'three-stdlib'
import type { ThreeElements } from '@react-three/fiber'

type GLTFResult = GLTF & {
  nodes: {
    Plane_1: THREE.Mesh
    Plane_2: THREE.Mesh
    Plane_3: THREE.Mesh
    Plane_4: THREE.Mesh
    Plane_5: THREE.Mesh
    Plane_6: THREE.Mesh
  }
  materials: {
    ['Material.001']: THREE.MeshStandardMaterial
    ['Material.002']: THREE.MeshStandardMaterial
    ['Material.003']: THREE.MeshStandardMaterial
    ['Material.004']: THREE.MeshStandardMaterial
    ['Material.005']: THREE.MeshStandardMaterial
    ['Material.006']: THREE.MeshStandardMaterial
  }
}

export function BaseTile(props: ThreeElements['group']) {
  const { nodes, materials } =
    useGLTF('/Modells/base.glb') as unknown as GLTFResult
  return (
    <group {...props} dispose={null}  scale={[1, 1, 1]}>
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
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane_3.geometry}
        material={materials['Material.003']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane_4.geometry}
        material={materials['Material.004']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane_5.geometry}
        material={materials['Material.005']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane_6.geometry}
        material={materials['Material.006']}
      />
    </group>
  )
}

useGLTF.preload('/Modells/base.glb')
