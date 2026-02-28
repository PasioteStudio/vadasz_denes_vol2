import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'
import type { GLTF } from 'three-stdlib'
import type { ThreeElements } from '@react-three/fiber'
import { useEffect } from 'react'

type GLTFResult = GLTF & {
  nodes: {
    Cylinder005_1: THREE.SkinnedMesh
    Cylinder005_2: THREE.SkinnedMesh
    Cylinder005_3: THREE.SkinnedMesh
    Cylinder005_4: THREE.SkinnedMesh
    Cylinder005_5: THREE.SkinnedMesh
    Cylinder005_6: THREE.SkinnedMesh
    Cylinder005_7: THREE.SkinnedMesh
    Cylinder005_8: THREE.SkinnedMesh
    Cylinder005_9: THREE.SkinnedMesh
    Cylinder005_10: THREE.SkinnedMesh
    Cylinder005_11: THREE.SkinnedMesh
    Cylinder005_12: THREE.SkinnedMesh
    Cylinder005_13: THREE.SkinnedMesh
    Bone: THREE.Bone
    Bone007: THREE.Bone
    Bone008: THREE.Bone
    Bone012: THREE.Bone
    Bone017: THREE.Bone
    Bone018: THREE.Bone
  }
  materials: {
    ['Material.010']: THREE.MeshStandardMaterial
    ['Material.011']: THREE.MeshStandardMaterial
    ['Material.012']: THREE.MeshStandardMaterial
    ['Material.013']: THREE.MeshStandardMaterial
    ['Material.001']: THREE.MeshStandardMaterial
    ['Material.002']: THREE.MeshStandardMaterial
    ['Material.003']: THREE.MeshStandardMaterial
    ['Material.005']: THREE.MeshStandardMaterial
    ['Material.006']: THREE.MeshStandardMaterial
    ['Material.007']: THREE.MeshStandardMaterial
    ['Material.008']: THREE.MeshStandardMaterial
    Material: THREE.MeshStandardMaterial
    ['Material.009']: THREE.MeshStandardMaterial
  }
}

export function StaticRover(props: ThreeElements['group']) {
  const { nodes, materials } =
    useGLTF('/Modells/marsrover-highres.glb') as unknown as GLTFResult
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
    <group {...props} dispose={null}>
      <group position={[1.069, 1.36, -0.226]}>
        <primitive object={nodes.Bone} />
        <primitive object={nodes.Bone007} />
        <primitive object={nodes.Bone008} />
        <primitive object={nodes.Bone012} />
        <primitive object={nodes.Bone017} />
        <primitive object={nodes.Bone018} />
        <skinnedMesh
          geometry={nodes.Cylinder005_1.geometry}
          material={materials['Material.010']}
          skeleton={nodes.Cylinder005_1.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cylinder005_2.geometry}
          material={materials['Material.011']}
          skeleton={nodes.Cylinder005_2.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cylinder005_3.geometry}
          material={materials['Material.012']}
          skeleton={nodes.Cylinder005_3.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cylinder005_4.geometry}
          material={materials['Material.013']}
          skeleton={nodes.Cylinder005_4.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cylinder005_5.geometry}
          material={materials['Material.001']}
          skeleton={nodes.Cylinder005_5.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cylinder005_6.geometry}
          material={materials['Material.002']}
          skeleton={nodes.Cylinder005_6.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cylinder005_7.geometry}
          material={materials['Material.003']}
          skeleton={nodes.Cylinder005_7.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cylinder005_8.geometry}
          material={materials['Material.005']}
          skeleton={nodes.Cylinder005_8.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cylinder005_9.geometry}
          material={materials['Material.006']}
          skeleton={nodes.Cylinder005_9.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cylinder005_10.geometry}
          material={materials['Material.007']}
          skeleton={nodes.Cylinder005_10.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cylinder005_11.geometry}
          material={materials['Material.008']}
          skeleton={nodes.Cylinder005_11.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cylinder005_12.geometry}
          material={materials.Material}
          skeleton={nodes.Cylinder005_12.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cylinder005_13.geometry}
          material={materials['Material.009']}
          skeleton={nodes.Cylinder005_13.skeleton}
        />
      </group>
    </group>
  )
}

useGLTF.preload('/Modells/marsrover-highres.glb')

