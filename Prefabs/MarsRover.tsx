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
const MODEL_ROTATION_OFFSET = -Math.PI

export function MarsRover({ ...props }: MarsRoverProps) {
  const group = useRef<THREE.Group>(null!)
  const cycle = useCycle()
  const timeline = useTimeline()

  const position = useRef(new THREE.Vector3())
  const rotationY = useRef(0)

  const elapsed = useRef(0)

  const subtickMoves = useRef<
    {
      needsRotate: boolean
      needsMove: boolean
      needsMine: boolean
      startPos: THREE.Vector3
      targetPos: THREE.Vector3
      startRot: number
      targetRot: number
      duration: number
    }[]
  >([])

  const tickDuration = useRef(600 / Math.abs(cycle.player.speed))

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

    if (cycle.direction === -1) {
      moves = moves.map(m => ({ from: m.to, to: m.from, mode: m.mode })).reverse()
    }

    subtickMoves.current = []

    let lastPos = position.current.clone()
    let lastRot = rotationY.current

    for (const move of moves) {
      const targetPos = new THREE.Vector3(
        move.to.x * TILE_GAP,
        0.8,
        move.to.y * TILE_GAP
      )

      const dir = new THREE.Vector3().subVectors(targetPos, lastPos)
      const rotatedDir =
        cycle.direction === -1 ? dir.clone().negate() : dir

      const targetRot =
        rotatedDir.length() > 0
          ? Math.atan2(rotatedDir.x, rotatedDir.z) + MODEL_ROTATION_OFFSET
          : lastRot

      subtickMoves.current.push({
        needsRotate: lastRot !== targetRot,
        needsMove: lastPos.distanceTo(targetPos) > 0,
        needsMine: move.mode === "mine",
        startPos: lastPos.clone(),
        targetPos,
        startRot: lastRot,
        targetRot,
        duration:
          (lastRot !== targetRot ? ROTATE_TIME : 0) +
          (lastPos.distanceTo(targetPos) > 0 ? MOVE_TIME : 0) +
          (move.mode === "mine" ? MINE_TIME : 0),
      })

      lastPos.copy(targetPos)
      lastRot = targetRot
    }

    elapsed.current = 0

    if (subtickMoves.current.length > 0) {
      const first = subtickMoves.current[0]
      group.current.position.copy(first.startPos)
      group.current.rotation.y = first.startRot
      position.current.copy(first.startPos)
      rotationY.current = first.startRot
    }

    tickDuration.current = 600 / Math.abs(cycle.player.speed)
  }, [cycle.currentTick, timeline.deltas, cycle.direction, cycle.player.speed])

  useFrame((_, delta) => {
    if (!subtickMoves.current.length) return

    elapsed.current += delta * 1000

    cycle.t.current = Math.min(elapsed.current / tickDuration.current, 1)

    let time = elapsed.current

    for (const step of subtickMoves.current) {
      const dur = step.duration

      if (time <= dur) {
        const progress = dur === 0 ? 1 : time / dur

        if (step.needsRotate) {
          const deltaRot = shortestAngleDelta(step.startRot, step.targetRot)
          const newRot = step.startRot + deltaRot * progress
          group.current.rotation.y = newRot
          rotationY.current = newRot
        }

        if (step.needsMove) {
          group.current.position.lerpVectors(
            step.startPos,
            step.targetPos,
            progress
          )
          position.current.copy(group.current.position)
        }

        break
      } else {
        if (step.needsRotate) {
          group.current.rotation.y = step.targetRot
          rotationY.current = step.targetRot
        }

        if (step.needsMove) {
          group.current.position.copy(step.targetPos)
          position.current.copy(step.targetPos)
        }

        time -= dur
      }
    }

    if (
      elapsed.current >= tickDuration.current &&
      cycle.player.playing === "playing"
    ) {
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