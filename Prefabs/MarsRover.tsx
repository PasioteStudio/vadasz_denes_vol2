import * as THREE from 'three'
import React, { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'
import type { GLTF } from 'three-stdlib'
import { TILE_GAP } from '@/components/rendering/TileRenderer'

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

type MarsRoverProps = ThreeElements['group'] & {
  targetPos?: {x:number, y: number}
  onSelect?: () => void
}

export function MarsRover({targetPos = {x:0,y:0}, ...props }: MarsRoverProps) {

  const group = useRef<THREE.Group>(null!)
  const targetX = useRef(0)

  const { nodes, materials } =
    useGLTF('/Modells/marsrover.glb') as unknown as GLTFResult
  //gombnyomásra mozgatjuk a marsrovert (teszt)

  useFrame((_, delta) => {
    if (!group.current) return
    //smoothan mozgatjuk

    const gap = TILE_GAP; // Adjust this value to increase/decrease the gap between tiles
    const position = [targetPos.x*gap, targetPos.y*gap ]
    group.current.position.x = position[0];
    group.current.position.z = position[1];
  })
  //modell dolgok
  return (
    //modell megnyomásakkor meghívjuk a invenotry megjelnítőt
    <group ref={group} {...props} dispose={null} scale={0.5} onClick={(e) => {e.stopPropagation(); props.onSelect?.();}} >
      <group position={[1.069, 3, -0.226]}>
        <primitive object={nodes.Bone} />
        <primitive object={nodes.Bone007} />
        <primitive object={nodes.Bone017} />
        <primitive object={nodes.Bone018} />
        <skinnedMesh
          geometry={nodes.Cube002_1.geometry}
          material={materials['Material.001']}
          skeleton={nodes.Cube002_1.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cube002_2.geometry}
          material={materials['Material.002']}
          skeleton={nodes.Cube002_2.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cube002_3.geometry}
          material={materials['Material.003']}
          skeleton={nodes.Cube002_3.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cube002_4.geometry}
          material={materials['Material.005']}
          skeleton={nodes.Cube002_4.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cube002_5.geometry}
          material={materials['Material.006']}
          skeleton={nodes.Cube002_5.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cube002_6.geometry}
          material={materials['Material.007']}
          skeleton={nodes.Cube002_6.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Cube002_7.geometry}
          material={materials['Material.008']}
          skeleton={nodes.Cube002_7.skeleton}
        />
      </group>
    </group>
  )
}

useGLTF.preload('/Modells/marsrover.glb')