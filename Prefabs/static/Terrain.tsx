import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'
import type { GLTF } from 'three-stdlib'
import type { ThreeElements } from '@react-three/fiber'
type GLTFResult = GLTF & {
  nodes: {
    Grid_1: THREE.Mesh
    Grid_2: THREE.Mesh
    Grid_3: THREE.Mesh
    Grid_4: THREE.Mesh
    Grid_5: THREE.Mesh
    Grid_6: THREE.Mesh
    Grid_7: THREE.Mesh
    Grid_8: THREE.Mesh
  }
  materials: {
    ['Material.011']: THREE.MeshStandardMaterial
    ['Material.007']: THREE.MeshStandardMaterial
    ['Material.008']: THREE.MeshStandardMaterial
    ['Material.009']: THREE.MeshStandardMaterial
    ['Material.010']: THREE.MeshStandardMaterial
    ['Material.012']: THREE.MeshStandardMaterial
    ['Material.013']: THREE.MeshStandardMaterial
    ['Material.014']: THREE.MeshStandardMaterial
  }
}

export function Terrain(props: ThreeElements['group']) {
  const { nodes, materials } =
    useGLTF('/Modells/terrain.glb') as unknown as GLTFResult
  return (
    //méretét felvettem meg pozícionálás.
    <group {...props} dispose={null} position={[0,-2,-80]}  scale={10}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Grid_1.geometry}
        material={materials['Material.011']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Grid_2.geometry}
        material={materials['Material.007']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Grid_3.geometry}
        material={materials['Material.008']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Grid_4.geometry}
        material={materials['Material.009']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Grid_5.geometry}
        material={materials['Material.010']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Grid_6.geometry}
        material={materials['Material.012']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Grid_7.geometry}
        material={materials['Material.013']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Grid_8.geometry}
        material={materials['Material.014']}
      />
    </group>
  )
}

useGLTF.preload('/Modells/terrain.glb')