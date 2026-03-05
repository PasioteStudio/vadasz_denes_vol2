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

  // Persisted position/rotation state (world values, updated each tick)
  const currentPos = useRef(new THREE.Vector3())
  const currentRotY = useRef(0)

  // Per-tick animation plan
  const tickPlan = useRef({
    startPos: new THREE.Vector3(),
    targetPos: new THREE.Vector3(),
    startRotY: 0,
    targetRotY: 0,
    rotate: false,
    mine: false,
    move: false,
    rotateDuration: 0,
    mineDuration: 0,
    moveDuration: 0,
    totalDuration: 0,
    startTime: 0,
  })

  const { nodes, materials, animations } =
    useGLTF("/Modells/marsrover.glb") as unknown as GLTFResult
  const { actions } = useAnimations(animations, group)

  function normalizeAngle(angle: number) {
    return Math.atan2(Math.sin(angle), Math.cos(angle))
  }

  function shortestAngleDelta(from: number, to: number) {
    let delta = normalizeAngle(to - from)
    return delta
  }

  useEffect(() => {
    const map = timeline.map;
    if (!timeline.map) return

    const rover = timeline.rover

    const targetPos = new THREE.Vector3(
      rover.position.x * gap,
      0.77,
      rover.position.y * gap
    )

    const startPos = currentPos.current.clone()
    const startRotY = currentRotY.current

    // Determine if position actually changed
    const positionChanged = !startPos.equals(targetPos)

    // Compute target rotation from movement direction (only if moving)
    let targetRotY = startRotY
    if (positionChanged) {
      const dx = targetPos.x - startPos.x
      const dz = targetPos.z - startPos.z
      targetRotY = Math.atan2(dx, dz)
    }

    const rotationChanged =
      Math.abs(shortestAngleDelta(startRotY, targetRotY)) > 0.001

    const mining = false //TODO

    const doRotate = rotationChanged
    const doMine = mining
    const doMove = positionChanged

    const rDur = doRotate ? rotateDuration / Math.abs(cycle.player.speed) : 0
    const mDur = doMine ? mineDuration / Math.abs(cycle.player.speed) : 0
    const mvDur = doMove ? moveDuration / Math.abs(cycle.player.speed) : 0
    const total = rDur + mDur + mvDur

    tickPlan.current = {
      startPos,
      targetPos,
      startRotY,
      targetRotY,
      rotate: doRotate,
      mine: doMine,
      move: doMove,
      rotateDuration: rDur,
      mineDuration: mDur,
      moveDuration: mvDur,
      totalDuration: total,
      startTime: Date.now(),
    }

    // Update persisted state to this tick's target (we are now "here")
    currentPos.current.copy(targetPos)
    currentRotY.current = targetRotY

    cycle.t.current = 0
  }, [cycle.currentTick])

  useFrame(() => {
    if (!group.current) return

    const plan = tickPlan.current
    const now = Date.now()
    const elapsed = now - plan.startTime

    const globalT = plan.totalDuration > 0
      ? Math.min(elapsed / plan.totalDuration, 1)
      : 1
    cycle.t.current = globalT

    const rotateEnd = plan.rotateDuration
    const mineEnd = rotateEnd + plan.mineDuration
    const moveEnd = mineEnd + plan.moveDuration

    // --- ROTATION PHASE ---
    let rotY: number
    if (!plan.rotate) {
      // No rotation this tick — stay at target
      rotY = plan.targetRotY
    } else if (elapsed >= rotateEnd) {
      // Rotation phase complete — snap to target
      rotY = plan.targetRotY
    } else {
      // Inside rotation phase
      const phaseT = elapsed / rotateEnd
      const delta = shortestAngleDelta(plan.startRotY, plan.targetRotY)
      rotY = plan.startRotY + delta * phaseT
    }
    group.current.rotation.y = rotY - Math.PI / 2

    // --- MINE PHASE --- (no visual, just time passing)
    const posY = 0.77

    // --- MOVE PHASE ---
    let posX: number
    let posZ: number
    if (!plan.move) {
      // No movement this tick — stay at target
      posX = plan.targetPos.x
      posZ = plan.targetPos.z
    } else if (elapsed < mineEnd) {
      // Move phase hasn't started yet — stay at start
      posX = plan.startPos.x
      posZ = plan.startPos.z
    } else if (elapsed >= moveEnd) {
      // Move phase complete — snap to target
      posX = plan.targetPos.x
      posZ = plan.targetPos.z
    } else {
      // Inside move phase
      const phaseElapsed = elapsed - mineEnd
      const phaseT = phaseElapsed / plan.moveDuration
      posX = THREE.MathUtils.lerp(plan.startPos.x, plan.targetPos.x, phaseT)
      posZ = THREE.MathUtils.lerp(plan.startPos.z, plan.targetPos.z, phaseT)
    }

    group.current.position.set(posX, posY, posZ)
    if (
      elapsed > tickPlan.current.totalDuration
      && cycle.player.playing == "playing"
    ) {
      cycle.setTick(cycle.currentTick + (cycle.player.speed < 0 ? -1 : 1));
    }
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

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

useGLTF.preload("/Modells/marsrover.glb")