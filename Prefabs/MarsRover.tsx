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
  const actionDurations = new Map<"mine" | "move" | "rotate", number>([
    ["mine", 300],
    ["move", 300],
    ["rotate", 300],
  ])
  const totalDuration = useRef(100);

  const position = useRef({
    start: new THREE.Vector3(),
    target: new THREE.Vector3()
  })

  const rotation = useRef({
    start: 0,
    target: 0,
  })

  const tickPlan = useRef<{ step: number, plan: { mode: "move" | "rotate" | "mine", duration: number }[] }>({
    step: 0,
    plan: []
  });

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

  useEffect(() => {
    if (!timeline.deltas.length) return;

    const start = timeline.deltas[0].moves[0].to;

    const startVec = new THREE.Vector3(
      start.x * gap,
      0.8,
      start.y * gap
    );

    position.current.start.copy(startVec);
    position.current.target.copy(startVec);

    group.current.position.copy(startVec);
  }, [timeline.deltas]);

  //TODO this will have to be improved when the multi movement ticks come into play
  useEffect(() => { // tick change -> set new plan
    const delta = timeline.deltas[cycle.currentTick]
    const moves = delta.moves;
    const d = cycle.direction == 1 ? moves[moves.length - 1] : moves[0];
    const targetPos = new THREE.Vector3(d.to.x * gap, 0.8, d.to.y * gap);

    let hasToRotate = false, hasToMove = false, hasToMine = false;

    // POSITION
    position.current.start = position.current.target;
    position.current.target = targetPos;


    // ROTATION
    rotation.current.start = rotation.current.target;

    if (position.current.start.distanceTo(position.current.target) != 0) {
      hasToMove = true;
      const dir = new THREE.Vector3()
        .subVectors(position.current.target, position.current.start)
        .normalize()

      rotation.current.target = Math.atan2(dir.x, dir.z) - Math.PI / 2 * cycle.direction
      hasToRotate = rotation.current.start != rotation.current.target;
    }

    hasToMine = delta.moves.find(m => m.mode == "mine") !== undefined || false; // TODO ezt újra kell dolgozni, ha több move van egy tickben.

    cycle.t.current = 0;
    elapsed.current = 0;
    totalDuration.current = 0;
    tickPlan.current.step = 0;
    tickPlan.current.plan = [];
    if (hasToRotate) {
      tickPlan.current.plan.push({
        mode: "rotate",
        duration: actionDurations.get("rotate")!
      });
    }
    if (hasToMove) {
      tickPlan.current.plan.push({
        mode: "move",
        duration: actionDurations.get("move")!
      });
    }
    if (hasToMine) {
      tickPlan.current.plan.push({
        mode: "mine",
        duration: actionDurations.get("mine")!
      });
    }

    console.log(tickPlan, targetPos)

    tickPlan.current.plan.forEach(p => totalDuration.current += actionDurations.get(p.mode)!)
  }, [cycle.currentTick, timeline.deltas])

  useFrame((_, delta) => {
    elapsed.current += delta * 1000;

    cycle.t.current = Math.min(elapsed.current / totalDuration.current, 1)
    const plan = tickPlan.current.plan;
    if (plan.length == 0) return;
    // POSITION
    const stepIndex = tickPlan.current.step;
    const step = plan[stepIndex];

    // total duration of previous steps
    const prevDuration = plan
      .slice(0, stepIndex)
      .reduce((sum, s) => sum + s.duration, 0);

    // normalized progress of the current step
    const progress = Math.min(
      1,
      Math.max(0, (elapsed.current - prevDuration) / step.duration)
    );

    // MOVE
    if (step.mode === "move") {
      const newPos = new THREE.Vector3(
        lerp(position.current.start.x, position.current.target.x, progress),
        1,
        lerp(position.current.start.z, position.current.target.z, progress)
      );

      group.current.position.set(newPos.x, 0.8, newPos.z);
    }

    // ROTATE
    if (step.mode === "rotate") {
      const rotDiff = shortestAngleDelta(
        rotation.current.start,
        rotation.current.target
      );

      const newRotY = rotation.current.start + rotDiff * progress;
      group.current.rotation.y = newRotY;
    }

    // advance step
    if (elapsed.current > prevDuration + step.duration) {
      tickPlan.current.step = Math.min(stepIndex + 1, plan.length - 1);
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

useGLTF.preload("/Modells/marsrover.glb")