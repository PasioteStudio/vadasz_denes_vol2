"use client"

import * as THREE from "three"
import { useRef, useEffect } from "react"
import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import type { ThreeElements } from "@react-three/fiber"
import type { GLTF } from "three-stdlib"
import { TILE_GAP } from "@/lib/constants"
import { useCycle, useTimeline } from "@/lib/contexts"

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

// Constants
const ROTATE_TIME = 200
const MOVE_TIME = 200
const MINE_TIME = 200

export function MarsRover({ ...props }: MarsRoverProps) {
  const group = useRef<THREE.Group>(null!)
  const cycle = useCycle()
  const timeline = useTimeline()

  const position = useRef(new THREE.Vector3())
  const rotationY = useRef(0)

  const elapsed = useRef(0)
  const subtickMoves = useRef<
    { needsRotate: boolean; needsMove: boolean; needsMine: boolean; startPos: THREE.Vector3; targetPos: THREE.Vector3; startRot: number; targetRot: number; duration: number }[]
  >([])

  const tickDuration = useRef(600 / Math.abs(cycle.player.speed))

  const { nodes, materials } =
    useGLTF("/Modells/marsrover.glb") as unknown as GLTFResult

  // Utility to normalize angles
  const normalizeAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle))
  const shortestAngleDelta = (from: number, to: number) => normalizeAngle(to - from)

  // Build subtick moves whenever the tick changes
  useEffect(() => {
    if (!timeline.deltas.length) return

    const currentDelta = timeline.deltas[cycle.currentTick]
    if (!currentDelta || !currentDelta.moves.length) return

    let moves = [...currentDelta.moves]

    // Reverse moves if going backwards
    if (cycle.direction === -1) {
      moves = moves
        .map(m => ({ from: m.to, to: m.from, mode: m.mode }))
        .reverse()
    }

    subtickMoves.current = []

    let lastPos = position.current.clone()
    let lastRot = rotationY.current

    for (const move of moves) {
      const targetPos = new THREE.Vector3(move.to.x * TILE_GAP, 0.8, move.to.y * TILE_GAP)
      let dir = new THREE.Vector3().subVectors(targetPos, lastPos)
      const targetRot = dir.length() > 0 ? Math.atan2(dir.x, dir.z) : lastRot

      subtickMoves.current.push({
        needsRotate: lastRot !== targetRot,
        needsMove: lastPos.distanceTo(targetPos) > 0,
        needsMine: move.mode === "mine",
        startPos: lastPos.clone(),
        targetPos,
        startRot: lastRot,
        targetRot,
        duration:
          (ROTATE_TIME * (lastRot !== targetRot ? 1 : 0)) +
          (MOVE_TIME * (lastPos.distanceTo(targetPos) > 0 ? 1 : 0)) +
          (MINE_TIME * (move.mode === "mine" ? 1 : 0)),
      })

      // Prepare for next move
      lastPos.copy(targetPos)
      lastRot = targetRot
    }

    // Reset elapsed time at tick start
    elapsed.current = 0

    // Snap rover to the last move's position/rotation in this tick
    if (subtickMoves.current.length > 0) {
      const last = subtickMoves.current[subtickMoves.current.length - 1]
      group.current.position.copy(last.targetPos)
      group.current.rotation.y = last.targetRot
      position.current.copy(last.targetPos)
      rotationY.current = last.targetRot
    }

    tickDuration.current = 600 / Math.abs(cycle.player.speed)
  }, [cycle.currentTick, timeline.deltas, cycle.direction, cycle.player.speed])

  // Animate rover per subtick
  useFrame((_, deltaSec) => {
    if (!subtickMoves.current.length) return

    elapsed.current += deltaSec * 1000

    // Global cycle.t between 0 and 1
    cycle.t.current = Math.min(elapsed.current / tickDuration.current, 1)

    let time = elapsed.current

    for (const subtick of subtickMoves.current) {
      const stepDur = subtick.duration

      if (time <= stepDur) {
        // Interpolate subtick
        if (subtick.needsRotate) {
          const deltaRot = shortestAngleDelta(subtick.startRot, subtick.targetRot)
          group.current.rotation.y = subtick.startRot + deltaRot * (time / stepDur)
          rotationY.current = group.current.rotation.y
        }

        if (subtick.needsMove) {
          group.current.position.lerpVectors(subtick.startPos, subtick.targetPos, time / stepDur)
          position.current.copy(group.current.position)
        }

        // Mining logic placeholder (could trigger animation/effects)
        if (subtick.needsMine) {
          // TODO: implement mining animation/effects
        }

        break
      } else {
        // Snap to target if elapsed exceeds this subtick
        if (subtick.needsRotate) {
          group.current.rotation.y = subtick.targetRot
          rotationY.current = subtick.targetRot
        }
        if (subtick.needsMove) {
          group.current.position.copy(subtick.targetPos)
          position.current.copy(subtick.targetPos)
        }
        time -= stepDur
      }
    }

    // Move to next tick if elapsed exceeds total duration
    if (elapsed.current >= tickDuration.current && cycle.player.playing === "playing") {
      cycle.setTick(cycle.currentTick + cycle.direction)
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
  {([
    ["Cube001", "Material.004"],
    ["Cube001_1", "Material.009"],
    ["Cube001_2", "Material.010"],
    ["Cube001_3", "Material.011"],
    ["Cube001_4", "Material.012"],
    ["Cube001_5", "Material.013"],
    ["Cube001_6", "Material.014"],
  ] as const).map(([meshName, matName], i) => {
    const mesh = nodes[meshName] as THREE.SkinnedMesh
    return (
      <skinnedMesh
        key={i}
        geometry={mesh.geometry}
        material={materials[matName]}
        skeleton={mesh.skeleton}
      />
    )
  })}
</group>
          <primitive object={nodes.Bone} />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload("/Modells/marsrover.glb")