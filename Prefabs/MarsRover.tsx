"use client"

import * as THREE from "three"
import { useRef, useEffect } from "react"
import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import type { ThreeElements } from "@react-three/fiber"
import type { GLTF } from "three-stdlib"
import { TILE_GAP } from "@/lib/constants"
import { useCycle, useTimeline, useUIHelper } from "@/lib/contexts"
import { RoverDustParticle } from "@/components/rendering/Particles/RoverDustParticle"

// ez sajnos ilyen...
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

// Az inventory popup megnyitásához
type MarsRoverProps = ThreeElements["group"]

const ROTATE_TIME = 100
const MOVE_TIME = 100
const MINE_TIME = 100
const MODEL_ROTATION_OFFSET = -Math.PI / 2

// Minden tick-ben megteendő mozdulatsort subtick-ekre osztunk
// (Először fordul, aztán mozog.)
type Subtick = {
  type: "rotate" | "move" | "mine"
  startPos: THREE.Vector3
  targetPos: THREE.Vector3
  startRot: number
  targetRot: number
  duration: number
}

const normalizeAngle = (angle: number) =>
  Math.atan2(Math.sin(angle), Math.cos(angle))

const shortestAngleDelta = (from: number, to: number) =>
  normalizeAngle(to - from)

const toWorld = (x: number, y: number) =>
  new THREE.Vector3(x * TILE_GAP, 0.8, y * TILE_GAP)

export function MarsRover({ ...props }: MarsRoverProps) {
  const group = useRef<THREE.Group>(null!)
  const cycle = useCycle()
  const timeline = useTimeline()
  const {toggleInventoryOpen} = useUIHelper();

  const position = useRef(new THREE.Vector3())
  const rotationY = useRef(0)
  const elapsed = useRef(0)
  const tickDuration = useRef(0)

  const subticks = useRef<Subtick[]>([])

  const { nodes, materials } =
    useGLTF("/Modells/marsrover.glb") as unknown as GLTFResult

  // Lejátszás és subtick generálás
  useEffect(() => {
    if (!timeline.deltas.length) return

    const tickIndex = Math.min(
      Math.max(cycle.currentTick, 0),
      timeline.deltas.length - 1
    )

    const baseDelta = timeline.deltas[tickIndex]
    if (!baseDelta) return

    let workingDelta = baseDelta

    // Visszafelé mozgunk, akkor elmozdul az index valamiért
    if (cycle.direction === -1) {
      const nextIndex = Math.min(
        cycle.currentTick + 1,
        timeline.deltas.length - 1
      )
      workingDelta = timeline.deltas[nextIndex]
    }

    if (!workingDelta?.moves.length) return

    let moves = [...workingDelta.moves]
    const speed = Math.abs(cycle.player.speed)

    // Visszafelé mozgásnál megcseréljük a mozdulatok kezdő és végpozícióját, illetve magának a listának a sorrendjét,
    // így később nem kell a mozdulatok listán fordítva végigmenni.
    if (cycle.direction === -1) {
      moves = moves
        .map((m) => ({ from: m.to, to: m.from, mode: m.mode }))
        .reverse()
    }

    // innentől belepakoljuk a "teendőket" a subticks arrayba.
    subticks.current = []

    const first = moves[0]
    const startPos = toWorld(first.from.x, first.from.y)

    group.current.position.copy(startPos)
    position.current.copy(startPos)

    let prevPos = startPos.clone()
    let prevRot = rotationY.current

    for (const move of moves) {
      const target = toWorld(move.to.x, move.to.y)

      const dir = new THREE.Vector3().subVectors(target, prevPos)
      const adjustedDir =
        cycle.direction === -1 ? dir.clone().negate() : dir

      const targetRot =
        adjustedDir.length() > 0
          ? Math.atan2(adjustedDir.x, adjustedDir.z) + MODEL_ROTATION_OFFSET
          : prevRot

      const rotateDuration =
        prevRot === targetRot ? 0 : ROTATE_TIME / speed

      subticks.current.push({
        type: "rotate",
        startPos: prevPos.clone(),
        targetPos: prevPos.clone(),
        startRot: prevRot,
        targetRot,
        duration: rotateDuration,
      })

      prevRot = targetRot

      const moveDuration =
        prevPos.equals(target) ? 0 : MOVE_TIME / speed

      subticks.current.push({
        type: "move",
        startPos: prevPos.clone(),
        targetPos: target.clone(),
        startRot: prevRot,
        targetRot: prevRot,
        duration: moveDuration,
      })

      prevPos.copy(target)

      if (move.mode === "mine") {
        subticks.current.push({
          type: "mine",
          startPos: prevPos.clone(),
          targetPos: prevPos.clone(),
          startRot: prevRot,
          targetRot: prevRot,
          duration: MINE_TIME / speed,
        })
      }
    }

    elapsed.current = 0
    tickDuration.current = subticks.current.reduce(
      (sum, s) => sum + s.duration,
      0
    )
  }, [cycle.currentTick, timeline.deltas, cycle.direction, cycle.player.speed])

  // Minden frame a jelenleg aktuális Subtick sorozatot hajtja végre.
  // FONTOS: a cycle.t változó a Rover animáció fázisához igazodik. 
  // Ettől függ például a <DayNightDirectionalLight /> mozgása is (a lerp része legalább is).
  // 0 <= t <= 1
  useFrame((_, delta) => {
    if (!subticks.current.length) return

    elapsed.current += delta * 1000
    cycle.t.current = Math.min(elapsed.current / tickDuration.current, 1)

    let time = elapsed.current

    for (const step of subticks.current) {
      const duration =
        step.type === "move" && step.startPos.equals(step.targetPos)
          ? 0
          : step.type === "rotate" && step.startRot === step.targetRot
          ? 0
          : step.duration

      if (time <= duration) {
        const p = duration === 0 ? 1 : Math.min(time / duration, 1)

        if (step.type === "rotate") {
          const d = shortestAngleDelta(step.startRot, step.targetRot)
          const r = step.startRot + d * p
          group.current.rotation.y = r
          rotationY.current = r
        }

        if (step.type === "move") {
          group.current.position.lerpVectors(
            step.startPos,
            step.targetPos,
            p
          )
          position.current.copy(group.current.position)
        }

        break
      }

      if (step.type === "rotate") {
        group.current.rotation.y = step.targetRot
        rotationY.current = step.targetRot
      } else {
        group.current.position.copy(step.targetPos)
        position.current.copy(step.targetPos)
      }

      time -= duration
    }

    if (
      elapsed.current >= tickDuration.current &&
      cycle.player.playing === "playing"
    ) {
      const next = cycle.currentTick + cycle.direction

      if (next >= 0 && next < timeline.deltas.length) {
        cycle.setTick(next)
      } else {
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
        toggleInventoryOpen()
      }}
    >
      <group name="Scene">
        <group name="Armature">
          <group name="Cube002">
            {(
              [
                ["Cube001", "Material.004"],
                ["Cube001_1", "Material.009"],
                ["Cube001_2", "Material.010"],
                ["Cube001_3", "Material.011"],
                ["Cube001_4", "Material.012"],
                ["Cube001_5", "Material.013"],
                ["Cube001_6", "Material.014"],
              ] as const
            ).map(([meshName, matName], i) => {
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

      <RoverDustParticle
        offset={[
          group.current?.getWorldPosition(new THREE.Vector3()).x ?? 0,
          0.3,
          group.current?.getWorldPosition(new THREE.Vector3()).z ?? 0,
        ]}
        rotation={rotationY.current}
        stepType={subticks.current}
      />
    </group>
  )
}

useGLTF.preload("/Modells/marsrover.glb")