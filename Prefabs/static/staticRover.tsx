import * as THREE from 'three'
import React, { useRef, useEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import type { GLTF } from 'three-stdlib'
import type { ThreeElements } from '@react-three/fiber'

type GLTFResult = GLTF & {
  nodes: {
    Cylinder001_1: THREE.SkinnedMesh
    Cylinder001_2: THREE.SkinnedMesh
    Cylinder001_3: THREE.SkinnedMesh
    Cylinder001_4: THREE.SkinnedMesh
    Cylinder001_5: THREE.SkinnedMesh
    Cylinder001_6: THREE.SkinnedMesh
    Cylinder001_7: THREE.SkinnedMesh
    Cylinder001_8: THREE.SkinnedMesh
    Cylinder002_1: THREE.SkinnedMesh
    Cylinder002_2: THREE.SkinnedMesh
    Cylinder002_3: THREE.SkinnedMesh
    Cylinder002_4: THREE.SkinnedMesh
    Cylinder002_5: THREE.SkinnedMesh
    Cylinder002_6: THREE.SkinnedMesh
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
    Cylinder_1: THREE.Mesh
    Cylinder_2: THREE.Mesh
    Cylinder_3: THREE.Mesh
    Cylinder_4: THREE.Mesh
    Cube001: THREE.SkinnedMesh
    Cube001_1: THREE.SkinnedMesh
    Cube001_2: THREE.SkinnedMesh
    Cube001_3: THREE.SkinnedMesh
    Cylinder004_1: THREE.Mesh
    Cylinder004_2: THREE.Mesh
    Cylinder004_3: THREE.Mesh
    Cylinder004_4: THREE.Mesh
    Cylinder004_5: THREE.Mesh
    Bone001: THREE.Bone
    Bone012: THREE.Bone
    Bone013: THREE.Bone
    Bone002: THREE.Bone
    Bone014: THREE.Bone
    Bone017: THREE.Bone
    neutral_bone: THREE.Bone
    Bone: THREE.Bone
  }
  materials: {
    ['Material.010']: THREE.MeshStandardMaterial
    ['Material.011']: THREE.MeshStandardMaterial
    ['Material.012']: THREE.MeshStandardMaterial
    ['Material.013']: THREE.MeshStandardMaterial
    ['Material.009']: THREE.MeshStandardMaterial
    ['Material.014']: THREE.MeshStandardMaterial
    ['Material.016']: THREE.MeshStandardMaterial
    ['Material.001']: THREE.MeshStandardMaterial
    ['Material.015']: THREE.MeshStandardMaterial
    ['Material.002']: THREE.MeshStandardMaterial
    ['Material.003']: THREE.MeshStandardMaterial
    ['Material.006']: THREE.MeshStandardMaterial
    ['Material.007']: THREE.MeshStandardMaterial
    ['Material.017']: THREE.MeshStandardMaterial
    ['Material.018']: THREE.MeshStandardMaterial
    ['Material.019']: THREE.MeshStandardMaterial
    ['Material.022']: THREE.MeshStandardMaterial
    ['Material.023']: THREE.MeshStandardMaterial
    ['Material.024']: THREE.MeshStandardMaterial
    ['Material.004']: THREE.MeshStandardMaterial
    ['Material.005']: THREE.MeshStandardMaterial
    ['Material.008']: THREE.MeshStandardMaterial
    ['Material.021']: THREE.MeshStandardMaterial
    ['Material.027']: THREE.MeshStandardMaterial
    ['Material.028']: THREE.MeshStandardMaterial
    ['Material.029']: THREE.MeshStandardMaterial
    ['Material.030']: THREE.MeshStandardMaterial
    ['Material.025']: THREE.MeshStandardMaterial
    ['Material.026']: THREE.MeshStandardMaterial
  }
  animations: THREE.AnimationClip[]
}

export function StaticRover(props: ThreeElements['group']) {
  const group = useRef<THREE.Group>(null!)
  const { nodes, materials, animations } = useGLTF('/Modells/marsrover-highres.glb') as unknown as GLTFResult
  const { actions } = useAnimations(animations, group)

  useEffect(() => {
    if (!actions) return
    console.log('Available animations:', Object.keys(actions))
    const idle = actions['idle']
    idle?.reset().fadeIn(0.3).play()
    return () => {
      idle?.fadeOut(0.3)
    }
  }, [actions])

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="Armature" position={[0.017, 0.304, 0.041]}>
          <group name="Cylinder001">
            <skinnedMesh name="Cylinder001_1" geometry={nodes.Cylinder001_1.geometry} material={materials['Material.010']} skeleton={nodes.Cylinder001_1.skeleton} />
            <skinnedMesh name="Cylinder001_2" geometry={nodes.Cylinder001_2.geometry} material={materials['Material.011']} skeleton={nodes.Cylinder001_2.skeleton} />
            <skinnedMesh name="Cylinder001_3" geometry={nodes.Cylinder001_3.geometry} material={materials['Material.012']} skeleton={nodes.Cylinder001_3.skeleton} />
            <skinnedMesh name="Cylinder001_4" geometry={nodes.Cylinder001_4.geometry} material={materials['Material.013']} skeleton={nodes.Cylinder001_4.skeleton} />
            <skinnedMesh name="Cylinder001_5" geometry={nodes.Cylinder001_5.geometry} material={materials['Material.009']} skeleton={nodes.Cylinder001_5.skeleton} />
            <skinnedMesh name="Cylinder001_6" geometry={nodes.Cylinder001_6.geometry} material={materials['Material.014']} skeleton={nodes.Cylinder001_6.skeleton} />
            <skinnedMesh name="Cylinder001_7" geometry={nodes.Cylinder001_7.geometry} material={materials['Material.016']} skeleton={nodes.Cylinder001_7.skeleton} />
            <skinnedMesh name="Cylinder001_8" geometry={nodes.Cylinder001_8.geometry} material={materials['Material.001']} skeleton={nodes.Cylinder001_8.skeleton} />
          </group>
          <group name="Cylinder002">
            <skinnedMesh name="Cylinder002_1" geometry={nodes.Cylinder002_1.geometry} material={materials['Material.009']} skeleton={nodes.Cylinder002_1.skeleton} />
            <skinnedMesh name="Cylinder002_2" geometry={nodes.Cylinder002_2.geometry} material={materials['Material.015']} skeleton={nodes.Cylinder002_2.skeleton} />
            <skinnedMesh name="Cylinder002_3" geometry={nodes.Cylinder002_3.geometry} material={materials['Material.002']} skeleton={nodes.Cylinder002_3.skeleton} />
            <skinnedMesh name="Cylinder002_4" geometry={nodes.Cylinder002_4.geometry} material={materials['Material.003']} skeleton={nodes.Cylinder002_4.skeleton} />
            <skinnedMesh name="Cylinder002_5" geometry={nodes.Cylinder002_5.geometry} material={materials['Material.006']} skeleton={nodes.Cylinder002_5.skeleton} />
            <skinnedMesh name="Cylinder002_6" geometry={nodes.Cylinder002_6.geometry} material={materials['Material.007']} skeleton={nodes.Cylinder002_6.skeleton} />
          </group>
          <group name="Cylinder005">
            <skinnedMesh name="Cylinder005_1"  geometry={nodes.Cylinder005_1.geometry}  material={materials['Material.010']} skeleton={nodes.Cylinder005_1.skeleton} />
            <skinnedMesh name="Cylinder005_2"  geometry={nodes.Cylinder005_2.geometry}  material={materials['Material.009']} skeleton={nodes.Cylinder005_2.skeleton} />
            <skinnedMesh name="Cylinder005_3"  geometry={nodes.Cylinder005_3.geometry}  material={materials['Material.014']} skeleton={nodes.Cylinder005_3.skeleton} />
            <skinnedMesh name="Cylinder005_4"  geometry={nodes.Cylinder005_4.geometry}  material={materials['Material.015']} skeleton={nodes.Cylinder005_4.skeleton} />
            <skinnedMesh name="Cylinder005_5"  geometry={nodes.Cylinder005_5.geometry}  material={materials['Material.017']} skeleton={nodes.Cylinder005_5.skeleton} />
            <skinnedMesh name="Cylinder005_6"  geometry={nodes.Cylinder005_6.geometry}  material={materials['Material.018']} skeleton={nodes.Cylinder005_6.skeleton} />
            <skinnedMesh name="Cylinder005_7"  geometry={nodes.Cylinder005_7.geometry}  material={materials['Material.019']} skeleton={nodes.Cylinder005_7.skeleton} />
            <skinnedMesh name="Cylinder005_8"  geometry={nodes.Cylinder005_8.geometry}  material={materials['Material.006']} skeleton={nodes.Cylinder005_8.skeleton} />
            <skinnedMesh name="Cylinder005_9"  geometry={nodes.Cylinder005_9.geometry}  material={materials['Material.007']} skeleton={nodes.Cylinder005_9.skeleton} />
            <skinnedMesh name="Cylinder005_10" geometry={nodes.Cylinder005_10.geometry} material={materials['Material.022']} skeleton={nodes.Cylinder005_10.skeleton} />
            <skinnedMesh name="Cylinder005_11" geometry={nodes.Cylinder005_11.geometry} material={materials['Material.023']} skeleton={nodes.Cylinder005_11.skeleton} />
            <skinnedMesh name="Cylinder005_12" geometry={nodes.Cylinder005_12.geometry} material={materials['Material.024']} skeleton={nodes.Cylinder005_12.skeleton} />
          </group>
          <primitive object={nodes.Bone001} />
          <primitive object={nodes.Bone012} />
          <primitive object={nodes.Bone013} />
          <primitive object={nodes.Bone002} />
          <primitive object={nodes.Bone014} />
          <primitive object={nodes.Bone017} />
          <primitive object={nodes.neutral_bone} />
        </group>
        <group
          name="Cylinder"
          position={[0, 1.142, 0.655]}
          rotation={[0, -1.175, 0]}
          scale={[0.062, 1.458, 0.062]}
        >
          <mesh name="Cylinder_1" castShadow receiveShadow geometry={nodes.Cylinder_1.geometry} material={materials['Material.004']} />
          <mesh name="Cylinder_2" castShadow receiveShadow geometry={nodes.Cylinder_2.geometry} material={materials['Material.005']} />
          <mesh name="Cylinder_3" castShadow receiveShadow geometry={nodes.Cylinder_3.geometry} material={materials['Material.008']} />
          <mesh name="Cylinder_4" castShadow receiveShadow geometry={nodes.Cylinder_4.geometry} material={materials['Material.021']} />
        </group>
        <group name="Armature001" position={[1, 1.851, 0.605]}>
          <group name="Cube">
            <skinnedMesh name="Cube001"   geometry={nodes.Cube001.geometry}   material={materials['Material.027']} skeleton={nodes.Cube001.skeleton} />
            <skinnedMesh name="Cube001_1" geometry={nodes.Cube001_1.geometry} material={materials['Material.028']} skeleton={nodes.Cube001_1.skeleton} />
            <skinnedMesh name="Cube001_2" geometry={nodes.Cube001_2.geometry} material={materials['Material.029']} skeleton={nodes.Cube001_2.skeleton} />
            <skinnedMesh name="Cube001_3" geometry={nodes.Cube001_3.geometry} material={materials['Material.030']} skeleton={nodes.Cube001_3.skeleton} />
          </group>
          <primitive object={nodes.Bone} />
        </group>
        <group name="Cylinder004" position={[1.065, 1.617, -0.151]} rotation={[0, -1.471, 0]}>
          <mesh name="Cylinder004_1" castShadow receiveShadow geometry={nodes.Cylinder004_1.geometry} material={materials['Material.022']} />
          <mesh name="Cylinder004_2" castShadow receiveShadow geometry={nodes.Cylinder004_2.geometry} material={materials['Material.023']} />
          <mesh name="Cylinder004_3" castShadow receiveShadow geometry={nodes.Cylinder004_3.geometry} material={materials['Material.024']} />
          <mesh name="Cylinder004_4" castShadow receiveShadow geometry={nodes.Cylinder004_4.geometry} material={materials['Material.025']} />
          <mesh name="Cylinder004_5" castShadow receiveShadow geometry={nodes.Cylinder004_5.geometry} material={materials['Material.026']} />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload('/Modells/marsrover-highres.glb')