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
    Plane: THREE.Mesh
    Cylinder: THREE.Mesh
  }
  materials: {
    ['Material.004']: THREE.MeshStandardMaterial
    ['Material.008']: THREE.MeshStandardMaterial
  }
}


export function WaterTile(props: ThreeElements['group']) {
  const { nodes, materials } =
    useGLTF('/Modells/kek.glb') as unknown as GLTFResult
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane.geometry}
        material={materials['Material.004']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder.geometry}
        material={materials['Material.008']}
        position={[0, 10, 0]}
        scale={0.1}
      />
    </group>
  )
}

useGLTF.preload('/Modells/kek.glb')
