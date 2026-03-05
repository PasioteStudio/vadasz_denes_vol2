"use client"

import { useCycle } from "@/lib/contexts"
import { useEffect, useRef } from "react"
import { TILE_GAP } from "./TileRenderer"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export default function DayNightDirectionalLights() {
    const lightRadius = 25 * TILE_GAP
    const orbitHeight = lightRadius / 3

    const { currentTick, timeOfDay, day, night, t } = useCycle()

    // References to Three.js lights
    const sunRef = useRef<THREE.DirectionalLight>(null!)
    const moonRef = useRef<THREE.DirectionalLight>(null!)

    // Lerp state
    const startPos = useRef(new THREE.Vector3())
    const targetPos = useRef(new THREE.Vector3())
    const tempPos = useRef(new THREE.Vector3())

    // Compute position of a light in orbit given a tick and duration
    const computeOrbitPosition = (tick: number, duration: number) => {
        const ratio = THREE.MathUtils.clamp(tick / duration, 0, 1)
        const angle = -Math.PI / 2 + ratio * Math.PI
        const x = Math.sin(angle) * lightRadius * 2
        const y = orbitHeight + Math.cos(angle) * lightRadius
        const z = -1.2 * lightRadius - Math.cos(angle) * lightRadius
        return new THREE.Vector3(x, y, z)
    }

    // Initialize start and target position
    useEffect(() => {
        const initial = computeOrbitPosition(0, day)
        startPos.current.copy(initial)
        targetPos.current.copy(initial)
        tempPos.current.copy(initial)
    }, [])

    // Update target position each tick
    useEffect(() => {
        const duration = timeOfDay === "day" ? day : night
        const tickInPhase = timeOfDay === "day" ? currentTick % 48 : currentTick % 48 - day

        // Compute new target
        targetPos.current.copy(computeOrbitPosition(tickInPhase, duration))

        // Compute start from previous tick
        const prevTick = Math.max(0, tickInPhase - 1)
        startPos.current.copy(computeOrbitPosition(prevTick, duration))
    }, [currentTick, timeOfDay, day, night])

    // Smoothly interpolate each frame
    useFrame(() => {
        tempPos.current.copy(startPos.current).lerp(targetPos.current, Math.min(t.current, 1))

        if (sunRef.current) sunRef.current.position.copy(tempPos.current)
        if (moonRef.current) moonRef.current.position.copy(tempPos.current)
    })

    const SHADOW_RESOLUTION = 4096
    const SHADOW_RADIUS = 2
    const SHADOW_BIAS = -0.0001
    const SHADOW_RANGE = 300

    return (
        <>
            {/* Sun */}
            <directionalLight
                ref={sunRef}
                intensity={timeOfDay === "day" ? 2 : 0}
                color={0xffffff}
                castShadow={timeOfDay === "day"}
                shadow-mapSize-width={SHADOW_RESOLUTION}
                shadow-mapSize-height={SHADOW_RESOLUTION}
                shadow-radius={SHADOW_RADIUS}
                shadow-bias={SHADOW_BIAS}
                shadow-camera-near={0.1}
                shadow-camera-far={SHADOW_RANGE}
                shadow-camera-left={-SHADOW_RANGE}
                shadow-camera-right={SHADOW_RANGE}
                shadow-camera-top={SHADOW_RANGE}
                shadow-camera-bottom={-SHADOW_RANGE}
            />

            {/* Moon */}
            <directionalLight
                ref={moonRef}
                intensity={timeOfDay === "night" ? 1.3 : 0}
                color={0xaaaaff}
                castShadow={timeOfDay === "night"}
                shadow-mapSize-width={SHADOW_RESOLUTION}
                shadow-mapSize-height={SHADOW_RESOLUTION}
                shadow-radius={SHADOW_RADIUS}
                shadow-bias={SHADOW_BIAS}
                shadow-camera-near={0.1}
                shadow-camera-far={SHADOW_RANGE}
                shadow-camera-left={-SHADOW_RANGE}
                shadow-camera-right={SHADOW_RANGE}
                shadow-camera-top={SHADOW_RANGE}
                shadow-camera-bottom={-SHADOW_RANGE}
            />
        </>
    )
}