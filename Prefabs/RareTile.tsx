import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'
import type { GLTF } from 'three-stdlib'
import type { ThreeElements } from '@react-three/fiber'

interface TileProps {
  position: [number, number, number]
}

type GLTFResult = GLTF & {
  nodes: {
    Plane002: THREE.Mesh
    Plane002_1: THREE.Mesh
  }
  materials: {
    ['Material.005']: THREE.MeshStandardMaterial
    ['Material.006']: THREE.MeshStandardMaterial
  }
}

export function RareTile(props: ThreeElements['group']) {
  const { nodes, materials } =
    useGLTF('/Modells/räriteten.glb') as unknown as GLTFResult
  return (
    <group {...props} dispose={null} scale={[1, 1, 1]}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane002.geometry}
        material={materials['Material.005']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane002_1.geometry}
        material={materials['Material.006']}
      />
    </group>
  )
}

useGLTF.preload('/Modells/räriteten.glb')
