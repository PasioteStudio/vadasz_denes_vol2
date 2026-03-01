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
        const y = 2 + Math.cos(angle) * radius;
        const z = -1.2*c;
    
        setOrbitPosition([x, y, z]);
      }, [currentTick])

      const resolution = 4096;
      const bias = -0.001;
      const radius = 2;
    return <>
        {/* daytime sun */}
        <directionalLight
            intensity={timeOfDay == 'day' ? 1 : 0}
            position={lightOrbitPosition}
            color={0xffffff}
            castShadow={timeOfDay == 'day'}
            shadow-mapSize-width={resolution}
            shadow-mapSize-height={resolution}
            shadow-radius={radius}
            shadow-bias={bias}
            // make sure the shadow camera covers a large area of the grid
            shadow-camera-near={0.1}
            shadow-camera-far={300}
            shadow-camera-left={-300}
            shadow-camera-right={300}
            shadow-camera-top={300}
            shadow-camera-bottom={-300}
        />
        {/* night light (blue) */}
        <directionalLight
            intensity={timeOfDay == 'night' ? 1 : 0}
            position={lightOrbitPosition}
            color={0xaaaaff}
            castShadow={timeOfDay == 'night'}
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
}