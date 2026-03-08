"use client"

import * as THREE from "three"
import React, { useRef, useEffect } from "react"
import { useGLTF, useAnimations } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import type { ThreeElements } from "@react-three/fiber"
import type { GLTF } from "three-stdlib"
import { TILE_GAP } from "@/components/rendering/TileRenderer"
import { useCycle, useTimeline } from "@/lib/contexts"
import { isOre } from "@/util/constants"
import { processMapChanges } from "@/util/deltas"
import { lerp } from "three/src/math/MathUtils.js"

type GLTFResult = GLTF & {
  nodes: {
    Cube001: THREE.SkinnedMesh
    Cube001_1: THREE.SkinnedMesh
    Cube001_2: THREE.SkinnedMesh
    Cube001_3: THREE.SkinnedMesh
    Cube001_4: THREE.SkinnedMesh
    Cube001_5: THREE.SkinnedMesh
    Cube001_6: THREE.SkinnedMesh
    Bone: THREE.Bone
  }
  materials: Record<string, THREE.MeshStandardMaterial>
}

type MarsRoverProps = ThreeElements["group"] & {
  onSelect?: () => void
}

export function MarsRover({ ...props }: MarsRoverProps) {
  const group = useRef<THREE.Group>(null!)
  const cycle = useCycle()
  const timeline = useTimeline()

  const gap = TILE_GAP
  const rotateDuration = 300
  const mineDuration = 300
  const moveDuration = 300
  const totalDuration = useRef(600);

  const position = useRef({
    start: new THREE.Vector3(),
    target: new THREE.Vector3()
  })

  const rotation = useRef({
    start: 0,
    target: 0,
  })

  const elapsed = useRef(0);

  // Persisted position/rotation state (world values, updated each tick)

  const { nodes, materials, animations } =
    useGLTF("/Modells/marsrover.glb") as unknown as GLTFResult

  function normalizeAngle(angle: number) {
    return Math.atan2(Math.sin(angle), Math.cos(angle))
  }

  function shortestAngleDelta(from: number, to: number) {
    let delta = normalizeAngle(to - from)
    return delta
  }

  //TODO this will have to be improved when the multi movement ticks come into play
  useEffect(() => { // tick change -> set new plan
    const delta = timeline.deltas[cycle.currentTick]
    const moves = delta.moves;
    const d = cycle.direction == 1 ? moves[moves.length - 1] : moves[0];

    const targetPos = new THREE.Vector3(d.to.x * gap, 1, d.to.y * gap);

    // POSITION
    position.current.start = position.current.target;
    position.current.target = targetPos;


    // ROTATION
    rotation.current.start = rotation.current.target;

    if (position.current.start.distanceTo(position.current.target) != 0) {
      const dir = new THREE.Vector3()
        .subVectors(position.current.target, position.current.start)
        .normalize()
      rotation.current.target = Math.atan2(dir.x, dir.z) - Math.PI / 2 * cycle.direction
    }

    cycle.t.current = 0;
    elapsed.current = 0;
    totalDuration.current = 300;
  }, [cycle.currentTick])

  useFrame((_, delta) => {
    elapsed.current += delta * 1000;

    cycle.t.current = Math.min(elapsed.current / totalDuration.current, 1)


    // POSITION
    const newPos = new THREE.Vector3(
      lerp(position.current.start.x, position.current.target.x, cycle.t.current),
      1,
      lerp(position.current.start.z, position.current.target.z, cycle.t.current)
    );
    group.current.position.x = newPos.x;
    group.current.position.y = 0.8;
    group.current.position.z = newPos.z;


    // ROTATION
    const rotDiff = shortestAngleDelta(rotation.current.start, rotation.current.target)
    let newRotY = rotation.current.start + rotDiff * cycle.t.current
    group.current.rotation.y = newRotY;
  })


  return (
    <group
      ref={group}
      {...props}
      dispose={null}
      scale={0.5}
      onClick={(e) => {
        e.stopPropagation()
        props.onSelect?.()
      }}
    >
      <group name="Scene">
        <group name="Armature">
          <group name="Cube002">
            <skinnedMesh
              geometry={nodes.Cube001.geometry}
              material={materials["Material.004"]}
              skeleton={nodes.Cube001.skeleton}
            />
            <skinnedMesh
              geometry={nodes.Cube001_1.geometry}
              material={materials["Material.009"]}
              skeleton={nodes.Cube001_1.skeleton}
            />
            <skinnedMesh
              geometry={nodes.Cube001_2.geometry}
              material={materials["Material.010"]}
              skeleton={nodes.Cube001_2.skeleton}
            />
            <skinnedMesh
              geometry={nodes.Cube001_3.geometry}
              material={materials["Material.011"]}
              skeleton={nodes.Cube001_3.skeleton}
            />
            <skinnedMesh
              geometry={nodes.Cube001_4.geometry}
              material={materials["Material.012"]}
              skeleton={nodes.Cube001_4.skeleton}
            />
            <skinnedMesh
              geometry={nodes.Cube001_5.geometry}
              material={materials["Material.013"]}
              skeleton={nodes.Cube001_5.skeleton}
            />
            <skinnedMesh
              geometry={nodes.Cube001_6.geometry}
              material={materials["Material.014"]}
              skeleton={nodes.Cube001_6.skeleton}
            />
          </group>
          <primitive object={nodes.Bone} />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload("/Modells/marsrover.glb")