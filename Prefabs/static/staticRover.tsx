import * as THREE from 'three'
import React, { useRef, useEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import type { GLTF } from 'three-stdlib'
import type { ThreeElements } from '@react-three/fiber'

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
    Cylinder005_14: THREE.SkinnedMesh
    Cylinder005_15: THREE.SkinnedMesh
    Cylinder005_16: THREE.SkinnedMesh
    Cylinder005_17: THREE.SkinnedMesh
    Bone001: THREE.Bone
    Bone012: THREE.Bone
    Bone013: THREE.Bone
    Bone002: THREE.Bone
    Bone014: THREE.Bone
    Bone017: THREE.Bone
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
  animations: THREE.AnimationClip[]   // <-- EZ HIÁNYZOTT
}

export function StaticRover(props: ThreeElements['group']) {
  const group = useRef<THREE.Group>(null!)

  const { nodes, materials, animations } =
    useGLTF('/Modells/marsrover-highres.glb') as unknown as GLTFResult

  const { actions } = useAnimations(animations, group)

  useEffect(() => {
    if (!actions) return

    console.log(Object.keys(actions)) // debug: nézd meg az anim neveket

    const idle = actions['idle'] // ha nagy I-vel van, akkor 'Idle'
    idle?.reset().fadeIn(0.3).play()

    return () => {
      idle?.fadeOut(0.3)
    }
  }, [actions])

  return (
    <group
      ref={group}
      {...props}
      dispose={null}
      position={[1.069, -0.3, -0.226]}
    >
      <group name="Scene">
        <group name="Armature" position={[0.017, 0.304, 0.041]}>
          <group name="Cylinder005">

            {Object.keys(nodes)
              .filter((key) => key.startsWith('Cylinder005_'))
              .map((key) => {
                const mesh = nodes[key as keyof typeof nodes] as THREE.SkinnedMesh
                return (
                  <skinnedMesh
                    key={key}
                    geometry={mesh.geometry}
                    material={mesh.material}
                    skeleton={mesh.skeleton}
                  />
                )
              })}

          </group>

          <primitive object={nodes.Bone001} />
          <primitive object={nodes.Bone012} />
          <primitive object={nodes.Bone013} />
          <primitive object={nodes.Bone002} />
          <primitive object={nodes.Bone014} />
          <primitive object={nodes.Bone017} />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload('/Modells/marsrover-highres.glb')