"use client"

import { useCycle } from "@/lib/contexts";
import { useState, useEffect } from "react";
import { TILE_GAP } from "./TileRenderer";

export default function DayNightDirectionalLights() {
    const c = 25 * TILE_GAP;

    const {currentTick, timeOfDay, day, night} = useCycle();
    const [lightOrbitPosition, setOrbitPosition] = useState<[number, number, number]>([0, 0, c]);
    useEffect(() => {
        const tod = timeOfDay;
        const duration = tod == "day" ? day : night;
        const relTick = (currentTick % 48) - (tod == "day" ? 0 : day);
        const ratio = relTick / duration;
    
        const t = Math.min(1, Math.max(0, ratio));
        const angle = -Math.PI / 2 + t * Math.PI;
        const radius = c;
    
        const x = Math.sin(angle) * radius * 2;
        const y = c + Math.cos(angle) * radius;
        const z = -1;
    
        setOrbitPosition([x, y, z]);
      }, [currentTick])

    return <>
        {/* daytime sun */}
        <directionalLight
            intensity={timeOfDay == 'day' ? 1 : 0}
            position={lightOrbitPosition}
            color={0xffffff}
            castShadow={timeOfDay == 'day'}
            shadow-mapSize-width={5096}
            shadow-mapSize-height={5096}
            // make sure the shadow camera covers a large area of the grid
            shadow-camera-near={0.1}
            shadow-camera-far={600}
            shadow-camera-left={-100}
            shadow-camera-right={100}
            shadow-camera-top={100}
            shadow-camera-bottom={-100}
        />
        {/* night light (blue) */}
        <directionalLight
            intensity={timeOfDay == 'night' ? 1 : 0}
            position={lightOrbitPosition}
            color={0xaaaaff}
            castShadow={timeOfDay == 'night'}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.1}
            shadow-camera-far={600}
            shadow-camera-left={-100}
            shadow-camera-right={100}
            shadow-camera-top={100}
            shadow-camera-bottom={-100}
        />
    </>
}