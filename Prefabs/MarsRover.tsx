import * as THREE from 'three'
import React, { useRef, useEffect, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'
import type { GLTF } from 'three-stdlib'
import { TILE_GAP } from '@/components/rendering/TileRenderer'
import { useCycle, useSnapshots } from '@/lib/contexts'
import { lerp } from 'three/src/math/MathUtils.js'
import { Position } from '@/types/RoverContextTypes'

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
  onSelect?: () => void
}

export function MarsRover({...props }: MarsRoverProps) {

  const group = useRef<THREE.Group>(null!)
  const cycle = useCycle();
  const rover = useSnapshots().snapshots.get(cycle.currentTick)!.rover;
  const gap = TILE_GAP;
  const actionStartTime = useRef(Date.now());
  const actionStart = useRef({
    position: new THREE.Vector2(rover.position.x*gap, rover.position.y*gap),
    rotation: 0,
  })
  const actionDuration = 300 / cycle.player.speed; //ms

  const [position, setPosition] = useState({
    target: new THREE.Vector2(rover.position.x*gap, rover.position.y*gap),
    current: new THREE.Vector2(rover.position.x*gap, rover.position.y*gap),
  })
  const [rotation, setRotation] = useState({
    target: 0,
    current: 0,
  })
  const [currentAction, setCurrentAction] = useState<"rotate" | "move">("rotate");

  const { nodes, materials } =
    useGLTF('/Modells/marsrover.glb') as unknown as GLTFResult
  //gombnyomásra mozgatjuk a marsrovert (teszt)
  useFrame((_, delta) => {
    if (!group.current) return

    const pos = group.current.position;
    const elapsed = Date.now() - actionStartTime.current;

    let newCurrent = position.current;
    let newRot = rotation.current;
    if(currentAction == "rotate"){
      newRot = newRot + (rotation.target - newRot) * Math.min(elapsed / actionDuration, 1); // TODO calculate rot
      setRotation(p => {return {
        ...p,
        current: newRot,
      }});
      if(newRot == rotation.target){
        setCurrentAction("move");
        actionStartTime.current = Date.now();
      }
    }else if(currentAction == "move"){
      newCurrent = actionStart.current.position.clone().lerp(position.target, Math.min(elapsed / actionDuration, 1));
      setPosition(p => {return {
        ...p,
        current: newCurrent,
      }})
      if(newCurrent == position.target){
        setCurrentAction("rotate");
        console.log("switched to rot")
        actionStartTime.current = Date.now();
      }
    }
    pos.x = newCurrent.x;
    pos.z = newCurrent.y;
    group.current.rotation.y = newRot;
    cycle.setIsInAnimation(position.target.distanceTo(newCurrent) != 0 && rotation.current == newRot);
  })

  useEffect(()=>{
    const newPos = new THREE.Vector2(rover.position.x*gap, rover.position.y*gap);
    setPosition(p => {return {
      ...p,
      target: newPos,
    }})
    setRotation(p => {return {
      ...p,
      target: new THREE.Vector2().angleTo(newPos),
    }})
    setCurrentAction("rotate")
    actionStartTime.current = Date.now();
    actionStart.current.position = position.current;
    cycle.setIsInAnimation(true);
  }, [cycle.currentTick])
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