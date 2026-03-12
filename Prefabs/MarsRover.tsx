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

const ROTATE_TIME = 200
const MOVE_TIME = 200
const MINE_TIME = 200
const MODEL_ROTATION_OFFSET = -Math.PI / 2

export function MarsRover({ ...props }: MarsRoverProps) {
  const group = useRef<THREE.Group>(null!)
  const cycle = useCycle()
  const timeline = useTimeline()

  const position = useRef(new THREE.Vector3())
  const rotationY = useRef(0)
  const elapsed = useRef(0)

  const subtickMoves = useRef<
    {
      type: "rotate" | "move" | "mine"
      startPos: THREE.Vector3
      targetPos: THREE.Vector3
      startRot: number
      targetRot: number
      duration: number
    }[]
  >([])

  const tickDuration = useRef(0)
  const { nodes, materials } =
    useGLTF("/Modells/marsrover.glb") as unknown as GLTFResult

  const normalizeAngle = (angle: number) =>
    Math.atan2(Math.sin(angle), Math.cos(angle))

  const shortestAngleDelta = (from: number, to: number) =>
    normalizeAngle(to - from)

useEffect(() => {
  if (!timeline.deltas.length) return

  // Clamp currentTick safely
  const tickIndex = Math.min(
    Math.max(cycle.currentTick, 0),
    timeline.deltas.length - 1
  )

  const currentDelta = timeline.deltas[tickIndex]
  if (!currentDelta) return

  // --- SELECT DELTA BASED ON DIRECTION ---
  let workingDelta = currentDelta

  if (cycle.direction === -1) {
    const nextIndex = Math.min(cycle.currentTick + 1, timeline.deltas.length - 1)
    workingDelta = timeline.deltas[nextIndex]
  }

  if (!workingDelta || !workingDelta.moves.length) return

  let moves = [...workingDelta.moves]
  const speedFactor = Math.abs(cycle.player.speed)

  // Reverse moves when playing backwards
  if (cycle.direction === -1) {
    moves = moves
      .map((m) => ({ from: m.to, to: m.from, mode: m.mode }))
      .reverse()
  }

  subtickMoves.current = []

  // --- SNAP TO TICK START POSITION ONLY ---
  const firstMove = moves[0]

  const tickStartPos = new THREE.Vector3(
    firstMove.from.x * TILE_GAP,
    0.8,
    firstMove.from.y * TILE_GAP
  )

  // Snap position only
  group.current.position.copy(tickStartPos)
  position.current.copy(tickStartPos)

  // --- BUILD SUBTICKS FROM CURRENT ROTATION ---
  let prevPos = tickStartPos.clone()
  let prevRot = rotationY.current // use current rotation for smooth lerp

  for (const move of moves) {
    const actualTarget = new THREE.Vector3(
      move.to.x * TILE_GAP,
      0.8,
      move.to.y * TILE_GAP
    )

    const moveDir = new THREE.Vector3().subVectors(actualTarget, prevPos)
    const rotatedDir =
      cycle.direction === -1 ? moveDir.clone().negate() : moveDir

    const targetRot =
      rotatedDir.length() > 0
        ? Math.atan2(rotatedDir.x, rotatedDir.z) + MODEL_ROTATION_OFFSET
        : prevRot

    // Rotate subtick
    const rotZero = prevRot === targetRot
    subtickMoves.current.push({
      type: "rotate",
      startPos: prevPos.clone(),
      targetPos: prevPos.clone(),
      startRot: prevRot,
      targetRot,
      duration: rotZero ? 0 : ROTATE_TIME / speedFactor,
    })
    prevRot = targetRot

    // Move subtick
    const moveZero = prevPos.equals(actualTarget)
    subtickMoves.current.push({
      type: "move",
      startPos: prevPos.clone(),
      targetPos: actualTarget.clone(),
      startRot: prevRot,
      targetRot: prevRot,
      duration: moveZero ? 0 : MOVE_TIME / speedFactor,
    })
    prevPos.copy(actualTarget)

    // Mine subtick
    if (move.mode === "mine") {
      subtickMoves.current.push({
        type: "mine",
        startPos: prevPos.clone(),
        targetPos: prevPos.clone(),
        startRot: prevRot,
        targetRot: prevRot,
        duration: MINE_TIME / speedFactor,
      })
    }
  }

  // Reset elapsed
  elapsed.current = 0

  // Calculate total tick duration
  tickDuration.current = subtickMoves.current.reduce(
    (sum, s) => sum + s.duration,
    0
  )
}, [cycle.currentTick, timeline.deltas, cycle.direction, cycle.player.speed])

  useFrame((_, delta) => {
    if (!subtickMoves.current.length) return

    elapsed.current += delta * 1000
    cycle.t.current = Math.min(elapsed.current / tickDuration.current, 1)

    let time = elapsed.current

    for (const step of subtickMoves.current) {
      // Skip zero-length steps immediately
      const stepDuration =
        step.type === "move" && step.startPos.equals(step.targetPos)
          ? 0
          : step.type === "rotate" && step.startRot === step.targetRot
          ? 0
          : step.duration

      if (time <= stepDuration) {
        const progress = stepDuration === 0 ? 1 : Math.min(time / stepDuration, 1)

        if (step.type === "rotate") {
          const deltaRot = shortestAngleDelta(step.startRot, step.targetRot)
          const newRot = step.startRot + deltaRot * progress
          group.current.rotation.y = newRot
          rotationY.current = newRot
        }

        if (step.type === "move") {
          group.current.position.lerpVectors(step.startPos, step.targetPos, progress)
          position.current.copy(group.current.position)
        }

        if (step.type === "mine") {
          // TODO: mining effects
        }

        break
      } else {
        // snap to step target
        if (step.type === "rotate") {
          group.current.rotation.y = step.targetRot
          rotationY.current = step.targetRot
        }
        if (step.type === "move" || step.type === "mine") {
          group.current.position.copy(step.targetPos)
          position.current.copy(step.targetPos)
        }

        time -= stepDuration
      }
    }

    // Handle tick boundaries safely
    if (elapsed.current >= tickDuration.current && cycle.player.playing === "playing") {
      const nextTick = cycle.currentTick + cycle.direction
      if (nextTick >= 0 && nextTick < timeline.deltas.length) {
        cycle.setTick(nextTick)
      } else {
        // clamp elapsed so rover stays at last position
        elapsed.current = tickDuration.current
      }
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