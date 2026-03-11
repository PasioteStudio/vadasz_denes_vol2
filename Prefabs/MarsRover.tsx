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
const MODEL_ROTATION_OFFSET = -Math.PI/2

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

    const currentDelta = timeline.deltas[cycle.currentTick]
    if (!currentDelta || !currentDelta.moves.length) return

    let moves = [...currentDelta.moves]
    const speedFactor = Math.abs(cycle.player.speed)

    if (cycle.direction === -1) {
      moves = moves.map(m => ({ from: m.to, to: m.from, mode: m.mode })).reverse()
    }

    subtickMoves.current = []

    let lastPos = position.current.clone()
    let lastRot = rotationY.current

    for (const move of moves) {
      const actualStart = lastPos.clone()
      const actualTarget = new THREE.Vector3(
        move.to.x * TILE_GAP,
        0.8,
        move.to.y * TILE_GAP
      )

      // rotation vector
      const dir = new THREE.Vector3().subVectors(actualTarget, actualStart)
      const rotatedDir = cycle.direction === -1 ? dir.clone().negate() : dir
      const targetRot =
        rotatedDir.length() > 0
          ? Math.atan2(rotatedDir.x, rotatedDir.z) + MODEL_ROTATION_OFFSET
          : lastRot

      // rotate subtick
      if (lastRot !== targetRot) {
        subtickMoves.current.push({
          type: "rotate",
          startPos: actualStart.clone(),
          targetPos: actualStart.clone(),
          startRot: lastRot,
          targetRot,
          duration: ROTATE_TIME / speedFactor,
        })
        lastRot = targetRot
      }

      // move subtick
      if (!actualStart.equals(actualTarget)) {
        subtickMoves.current.push({
          type: "move",
          startPos: actualStart.clone(),
          targetPos: actualTarget.clone(),
          startRot: lastRot,
          targetRot: lastRot,
          duration: MOVE_TIME / speedFactor,
        })
        lastPos.copy(actualTarget)
      }

      // mine subtick
      if (move.mode === "mine") {
        subtickMoves.current.push({
          type: "mine",
          startPos: lastPos.clone(),
          targetPos: lastPos.clone(),
          startRot: lastRot,
          targetRot: lastRot,
          duration: MINE_TIME / speedFactor,
        })
      }
    }

    elapsed.current = 0

    if (subtickMoves.current.length > 0) {
      const first = subtickMoves.current[0]
      group.current.position.copy(first.startPos)
      group.current.rotation.y = first.startRot
      position.current.copy(first.startPos)
      rotationY.current = first.startRot
    }

    tickDuration.current = subtickMoves.current.reduce((sum, s) => sum + s.duration, 0)
  }, [cycle.currentTick, timeline.deltas, cycle.direction, cycle.player.speed])

  useFrame((_, delta) => {
    if (!subtickMoves.current.length) return

    elapsed.current += delta * 1000
    cycle.t.current = Math.min(elapsed.current / tickDuration.current, 1)

    let time = elapsed.current

    for (const step of subtickMoves.current) {
      if (time <= step.duration) {
        const progress = step.duration === 0 ? 1 : time / step.duration

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
        if (step.type === "rotate") {
          group.current.rotation.y = step.targetRot
          rotationY.current = step.targetRot
        }

        if (step.type === "move") {
          group.current.position.copy(step.targetPos)
          position.current.copy(step.targetPos)
        }

        time -= step.duration
      }
    }

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