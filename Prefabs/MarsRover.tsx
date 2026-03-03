import * as THREE from 'three'
import React, { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'
import type { GLTF } from 'three-stdlib'
import { TILE_GAP } from '@/components/rendering/TileRenderer'
import { useCycle, useSnapshots } from '@/lib/contexts'

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

export function MarsRover({ ...props }: MarsRoverProps) {
  const group = useRef<THREE.Group>(null!)

  const cycle = useCycle()
  const rover = useSnapshots().snapshots.get(cycle.currentTick)!.rover
  const gap = TILE_GAP

  /** Animation State */
  const action = useRef<"idle" | "rotate" | "move">("idle")

  const startTime = useRef(0)
  const duration = useRef(0.3)

  const startPos = useRef(new THREE.Vector2())
  const targetPos = useRef(new THREE.Vector2())

  const startRot = useRef(0)
  const targetRot = useRef(0)

  const currentPos = useRef(
    new THREE.Vector2(
      rover.position.x * gap,
      rover.position.y * gap
    )
  )

  const currentRot = useRef(0)

  /** Normalize angle to shortest rotation path */
  function normalizeAngle(angle: number) {
    return Math.atan2(Math.sin(angle), Math.cos(angle))
  }

  /**
   * Start first tick when switching to playing
   */
  useEffect(() => {
    if (
      cycle.player.playing === "playing" &&
      action.current === "idle" &&
      !cycle.isInAnimation
    ) {
      cycle.setTick(
        cycle.currentTick +
          (cycle.player.speed < 0 ? -1 : 1)
      )
    }
  }, [cycle.player.playing])

  /**
   * Tick change → setup animation
   */
  useEffect(() => {
  const newPos = new THREE.Vector2(
    rover.position.x * gap,
    rover.position.y * gap
  )

  const dir = newPos.clone().sub(currentPos.current)

  // ---- NO MOVEMENT (e.g. mining) ----
  if (dir.lengthSq() === 0) {
    if (cycle.player.playing === "playing") {
      cycle.setTick(
        cycle.currentTick +
          (cycle.player.speed < 0 ? -1 : 1)
      )
    }
    return
  }

  // ---- NORMAL MOVEMENT ----
  startRot.current = currentRot.current

let angle = Math.atan2(dir.x, dir.y)

// If playing backwards, keep facing forward
if (cycle.player.speed < 0) {
  angle += Math.PI
}

targetRot.current = angle

  startTime.current = 0
  duration.current = 0.25
  action.current = "rotate"

  startPos.current.copy(currentPos.current)
  targetPos.current.copy(newPos)

  cycle.setIsInAnimation(true)
}, [cycle.currentTick])

  /**
   * Frame loop
   */
  useFrame((state) => {
    if (!group.current) return
    if (action.current === "idle") return

    if (startTime.current === 0) {
      startTime.current = state.clock.getElapsedTime()
    }

    const elapsed =
      state.clock.getElapsedTime() -
      startTime.current

    const t = Math.min(elapsed / duration.current, 1)

    if (action.current === "rotate") {
      const diff = normalizeAngle(
        targetRot.current - startRot.current
      )

      currentRot.current =
        startRot.current + diff * t

      if (t >= 1) {
        action.current = "move"
        startTime.current =
          state.clock.getElapsedTime()
        duration.current =
          0.35 / Math.abs(cycle.player.speed)
      }
    } else if (action.current === "move") {
      currentPos.current.lerpVectors(
        startPos.current,
        targetPos.current,
        t
      )

      if (t >= 1) {
        action.current = "idle"
        cycle.setIsInAnimation(false)

        if (cycle.player.playing === "playing") {
          cycle.setTick(
            cycle.currentTick +
              (cycle.player.speed < 0 ? -1 : 1)
          )
        }
      }
    }

    /** Apply transforms */
    group.current.position.x =
      currentPos.current.x
    group.current.position.z =
      currentPos.current.y

    // model forward correction
    group.current.rotation.y =
      currentRot.current - Math.PI / 2
  })

  const { nodes, materials } =
    useGLTF(
      '/Modells/marsrover.glb'
    ) as unknown as GLTFResult

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