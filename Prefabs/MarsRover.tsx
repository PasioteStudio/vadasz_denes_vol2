import * as THREE from 'three'
import React, { useRef, useEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'
import type { GLTF } from 'three-stdlib'
import { TILE_GAP } from '@/components/rendering/TileRenderer'
import { useCycle, useSnapshots } from '@/lib/contexts'
import { ROVER_ANIMATION } from '@/util/constants';

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
  materials: {
    ['Material.004']: THREE.MeshStandardMaterial
    ['Material.009']: THREE.MeshStandardMaterial
    ['Material.010']: THREE.MeshStandardMaterial
    ['Material.011']: THREE.MeshStandardMaterial
    ['Material.012']: THREE.MeshStandardMaterial
    ['Material.013']: THREE.MeshStandardMaterial
    ['Material.014']: THREE.MeshStandardMaterial
  }
}

type ActionName = 'IDLE' | 'mine'
type GLTFActions = Record<ActionName, THREE.AnimationAction>

type MarsRoverProps = ThreeElements['group'] & {
  onSelect?: () => void
}

export function MarsRover({ ...props }: MarsRoverProps) {
  const group = useRef<THREE.Group>(null!)

  const cycle = useCycle()
  const rover = useSnapshots().snapshots.get(cycle.currentTick)!.rover
  const gap = TILE_GAP


  const { nodes, materials, animations } =
    useGLTF('/Modells/marsrover.glb') as unknown as GLTFResult
const { actions } = useAnimations(animations, group)

  /**
   * Animation state machine
   */

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

  useEffect(() => {
    if (!group.current) return

    group.current.position.x = currentPos.current.x
    group.current.position.z = currentPos.current.y
    group.current.rotation.y =
      currentRot.current - Math.PI / 2
  }, [])
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
  //ANIMÁCIÓ
  const callMine = () => {
    
      if (actions['mine']) {
        actions['mine'].timeScale = 2
        actions['mine'].setLoop(THREE.LoopOnce, 1)
        actions['mine'].clampWhenFinished = true
        actions['mine'].play()
      }
  }

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
    duration.current = ROVER_ANIMATION.rotate
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

    cycle.t.current = Math.min(elapsed / duration.current, 1);

    if (action.current === "rotate") {
      const diff = normalizeAngle(
        targetRot.current - startRot.current
      )

      currentRot.current =
        startRot.current + diff * cycle.t.current

      if (cycle.t.current >= 1) {
        action.current = "move"
      //mine animáció indítása
        callMine(); // the. what.


        startTime.current = state.clock.getElapsedTime()
        duration.current = 0.35 / cycle.player.speed

        startTime.current =
          state.clock.getElapsedTime()
        duration.current = ROVER_ANIMATION.move / Math.abs(cycle.player.speed)

      }
    } else if (action.current === "move") {
      currentPos.current.lerpVectors(
        startPos.current,
        targetPos.current,
        cycle.t.current
      )

      if (cycle.t.current >= 1) {
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


  return (
    <group
      ref={group}
      {...props}
      dispose={null}
      scale={0.5}
      position={[1.069, 1, -0.226]}
      onClick={(e) => {
        e.stopPropagation()
        props.onSelect?.()
      }}
    >
      <group name="Scene">
        <group name="Armature">
          <group name="Cube002">
            <skinnedMesh
              name="Cube001"
              geometry={nodes.Cube001.geometry}
              material={materials['Material.004']}
              skeleton={nodes.Cube001.skeleton}
            />
            <skinnedMesh
              name="Cube001_1"
              geometry={nodes.Cube001_1.geometry}
              material={materials['Material.009']}
              skeleton={nodes.Cube001_1.skeleton}
            />
            <skinnedMesh
              name="Cube001_2"
              geometry={nodes.Cube001_2.geometry}
              material={materials['Material.010']}
              skeleton={nodes.Cube001_2.skeleton}
            />
            <skinnedMesh
              name="Cube001_3"
              geometry={nodes.Cube001_3.geometry}
              material={materials['Material.011']}
              skeleton={nodes.Cube001_3.skeleton}
            />
            <skinnedMesh
              name="Cube001_4"
              geometry={nodes.Cube001_4.geometry}
              material={materials['Material.012']}
              skeleton={nodes.Cube001_4.skeleton}
            />
            <skinnedMesh
              name="Cube001_5"
              geometry={nodes.Cube001_5.geometry}
              material={materials['Material.013']}
              skeleton={nodes.Cube001_5.skeleton}
            />
            <skinnedMesh
              name="Cube001_6"
              geometry={nodes.Cube001_6.geometry}
              material={materials['Material.014']}
              skeleton={nodes.Cube001_6.skeleton}
            />
          </group>
          <primitive object={nodes.Bone} />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload('/Modells/marsrover.glb')
