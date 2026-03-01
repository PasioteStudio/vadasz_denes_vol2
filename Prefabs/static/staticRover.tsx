import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'
import type { GLTF } from 'three-stdlib'
import type { ThreeElements } from '@react-three/fiber'
import { useEffect } from 'react'

type GLTFResult = GLTF & {
  nodes: {
    Cylinder005_1: THREE.Mesh
    Cylinder005_2: THREE.Mesh
    Cylinder005_3: THREE.Mesh
    Cylinder005_4: THREE.Mesh
    Cylinder005_5: THREE.Mesh
    Cylinder005_6: THREE.Mesh
    Cylinder005_7: THREE.Mesh
    Cylinder005_8: THREE.Mesh
    Cylinder005_9: THREE.Mesh
    Cylinder005_10: THREE.Mesh
    Cylinder005_11: THREE.Mesh
    Cylinder005_12: THREE.Mesh
    Cylinder005_13: THREE.Mesh
    Cylinder005_14: THREE.Mesh
    Cylinder005_15: THREE.Mesh
    Cylinder005_16: THREE.Mesh
    Cylinder005_17: THREE.Mesh
  }
  materials: {
    ['Material.010']: THREE.MeshStandardMaterial
    ['Material.011']: THREE.MeshStandardMaterial
    ['Material.012']: THREE.MeshStandardMaterial
    ['Material.013']: THREE.MeshStandardMaterial
    ['Material.009']: THREE.MeshStandardMaterial
    ['Material.014']: THREE.MeshStandardMaterial
    ['Material.015']: THREE.MeshStandardMaterial
    ['Material.016']: THREE.MeshStandardMaterial
    ['Material.017']: THREE.MeshStandardMaterial
    ['Material.018']: THREE.MeshStandardMaterial
    ['Material.019']: THREE.MeshStandardMaterial
    Material: THREE.MeshStandardMaterial
    ['Material.020']: THREE.MeshStandardMaterial
    ['Material.001']: THREE.MeshStandardMaterial
    ['Material.003']: THREE.MeshStandardMaterial
    ['Material.006']: THREE.MeshStandardMaterial
    ['Material.007']: THREE.MeshStandardMaterial
  }
}

export function StaticRover(props: ThreeElements['group']) {
  const { nodes, materials } =
    useGLTF('/Modells/marsrover-highres.glb') as unknown as GLTFResult


  return (
    <group {...props} dispose={null} position={[1.069, -0.3, -0.226]}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_1.geometry}
        material={materials['Material.010']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_2.geometry}
        material={materials['Material.011']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_3.geometry}
        material={materials['Material.012']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_4.geometry}
        material={materials['Material.013']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_5.geometry}
        material={materials['Material.009']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_6.geometry}
        material={materials['Material.014']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_7.geometry}
        material={materials['Material.015']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_8.geometry}
        material={materials['Material.016']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_9.geometry}
        material={materials['Material.017']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_10.geometry}
        material={materials['Material.018']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_11.geometry}
        material={materials['Material.019']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_12.geometry}
        material={materials.Material}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_13.geometry}
        material={materials['Material.020']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_14.geometry}
        material={materials['Material.001']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_15.geometry}
        material={materials['Material.003']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_16.geometry}
        material={materials['Material.006']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder005_17.geometry}
        material={materials['Material.007']}
      />
    </group>
  )
}

useGLTF.preload('/Modells/marsrover-highres.glb')

