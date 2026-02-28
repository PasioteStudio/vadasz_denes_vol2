import * as THREE from 'three'
import React, { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'
import type { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    Cube002_1: THREE.SkinnedMesh
    Cube002_2: THREE.SkinnedMesh
    Cube002_3: THREE.SkinnedMesh
    Cube002_4: THREE.SkinnedMesh
    Cube002_5: THREE.SkinnedMesh
    Cube002_6: THREE.SkinnedMesh
    Cube002_7: THREE.SkinnedMesh
    Bone: THREE.Bone
    Bone007: THREE.Bone
    Bone008: THREE.Bone
    Bone012: THREE.Bone
    Bone017: THREE.Bone
    Bone018: THREE.Bone
  }
  materials: {
    ['Material.001']: THREE.MeshStandardMaterial
    ['Material.002']: THREE.MeshStandardMaterial
    ['Material.003']: THREE.MeshStandardMaterial
    ['Material.005']: THREE.MeshStandardMaterial
    ['Material.006']: THREE.MeshStandardMaterial
    ['Material.007']: THREE.MeshStandardMaterial
    ['Material.008']: THREE.MeshStandardMaterial
  }
}

type MarsRoverProps = ThreeElements['group']

export function StaticRover({ ...props }: MarsRoverProps) {
  const group = useRef<THREE.Group>(null!)
  const { nodes, materials } =
    useGLTF('/Modells/marsrover.glb') as unknown as GLTFResult

  useEffect(() => {
    const fixGeometry = (geo: THREE.BufferGeometry) => {
      if (!geo.attributes.normal) return

      const normals = geo.attributes.normal

      // 🔴 invert normals
      for (let i = 0; i < normals.count; i++) {
        normals.setXYZ(
          i,
          -normals.getX(i),
          -normals.getY(i),
          -normals.getZ(i)
        )
      }

      normals.needsUpdate = true

      // recompute (optional but helps)
      geo.computeVertexNormals()
    }

    Object.values(nodes).forEach((node: any) => {
      if (node.isSkinnedMesh && node.geometry) {
        fixGeometry(node.geometry)
      }
    })
  }, [nodes])

  return (
    <group ref={group} {...props} dispose={null} castShadow>
      <group>
        <primitive object={nodes.Bone} />
        <primitive object={nodes.Bone007} />
        <primitive object={nodes.Bone008} />
        <primitive object={nodes.Bone012} />
        <primitive object={nodes.Bone017} />
        <primitive object={nodes.Bone018} />

        <skinnedMesh geometry={nodes.Cube002_1.geometry} material={materials['Material.001']} skeleton={nodes.Cube002_1.skeleton} />
        <skinnedMesh geometry={nodes.Cube002_2.geometry} material={materials['Material.002']} skeleton={nodes.Cube002_2.skeleton} />
        <skinnedMesh geometry={nodes.Cube002_3.geometry} material={materials['Material.003']} skeleton={nodes.Cube002_3.skeleton} />
        <skinnedMesh geometry={nodes.Cube002_4.geometry} material={materials['Material.005']} skeleton={nodes.Cube002_4.skeleton} />
        <skinnedMesh geometry={nodes.Cube002_5.geometry} material={materials['Material.006']} skeleton={nodes.Cube002_5.skeleton} />
        <skinnedMesh geometry={nodes.Cube002_6.geometry} material={materials['Material.007']} skeleton={nodes.Cube002_6.skeleton} />
        <skinnedMesh geometry={nodes.Cube002_7.geometry} material={materials['Material.008']} skeleton={nodes.Cube002_7.skeleton} />
      </group>
    </group>
  )
}

useGLTF.preload('/Modells/marsrover.glb')