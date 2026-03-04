"use client"

import { useCycle } from "@/lib/contexts"
import { useEffect, useRef } from "react"
import { TILE_GAP } from "./TileRenderer"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export default function DayNightDirectionalLights() {
    const c = 25 * TILE_GAP

    const { currentTick, timeOfDay, day, night, t } = useCycle()

    // Light refs (actual Three.js objects)
    const dayLight = useRef<THREE.DirectionalLight>(null!)
    const nightLight = useRef<THREE.DirectionalLight>(null!)

    // Lerp state
    const startPos = useRef(new THREE.Vector3())
    const targetPos = useRef(new THREE.Vector3())
    const temp = useRef(new THREE.Vector3())

    // Initialize starting position
    useEffect(() => {
        const initial = new THREE.Vector3(0, c / 3, c)
        startPos.current.copy(initial)
        targetPos.current.copy(initial)
    }, [])

    // Update target position whenever tick changes
    useEffect(() => {
        // Move previous target into start
        startPos.current.copy(temp.current)

        const tod = timeOfDay
        const duration = tod === "day" ? day : night
        const relTick = (currentTick % 48) - (tod === "day" ? 0 : day)

        const ratio = Math.min(1, Math.max(0, relTick / duration))
        const angle = -Math.PI / 2 + ratio * Math.PI
        const radius = c

        const x = Math.sin(angle) * radius * 2
        const y = c / 3 + Math.cos(angle) * radius
        const z = -1.2 * c - Math.cos(angle) * radius

        targetPos.current.set(x, y, z)
    }, [currentTick, timeOfDay, day, night, c])

    // Smooth interpolation each frame
    useFrame(() => {
        temp.current
            .copy(startPos.current)
            .lerp(targetPos.current, Math.min(t.current,1))

        if (dayLight.current) {
            dayLight.current.position.copy(temp.current)
        }

        if (nightLight.current) {
            nightLight.current.position.copy(temp.current)
        }
    })

    const resolution = 4096
    const bias = -0.0001
    const radius = 2

    return (
        <>
            {/* Sun */}
            <directionalLight
                ref={dayLight}
                intensity={timeOfDay === "day" ? 2 : 0}
                color={0xffffff}
                castShadow={timeOfDay === "day"}
                shadow-mapSize-width={resolution}
                shadow-mapSize-height={resolution}
                shadow-radius={radius}
                shadow-bias={bias}
                shadow-camera-near={0.1}
                shadow-camera-far={300}
                shadow-camera-left={-300}
                shadow-camera-right={300}
                shadow-camera-top={300}
                shadow-camera-bottom={-300}
            />

            {/* Moon */}
            <directionalLight
                ref={nightLight}
                intensity={timeOfDay === "night" ? 1.3 : 0}
                color={0xaaaaff}
                castShadow={timeOfDay === "night"}
                shadow-mapSize-width={resolution}
                shadow-mapSize-height={resolution}
                shadow-camera-near={0.1}
                shadow-camera-far={300}
                shadow-camera-left={-300}
                shadow-camera-right={300}
                shadow-camera-top={300}
                shadow-camera-bottom={-300}
                shadow-radius={radius}
                shadow-bias={bias}
            />
        </>
    )
}