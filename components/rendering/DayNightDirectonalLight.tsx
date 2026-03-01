"use client"

import { useCycle } from "@/lib/contexts";
import { useState, useEffect } from "react";

export default function DayNightDirectionalLights() {
    const {currentTick, timeOfDay, day, night} = useCycle();
    const [lightOrbitPosition, setOrbitPosition] = useState<[number, number, number]>([-2, 2, -1]);
    useEffect(() => {
        const tod = timeOfDay;
        const duration = tod == "day" ? day : night;
        const relTick = (currentTick % 48) - (tod == "day" ? 0 : day);
        const ratio = relTick / duration;
    
        const t = Math.min(1, Math.max(0, ratio));
        const angle = -Math.PI / 2 + t * Math.PI;
        const radius = 2;
    
        const x = Math.sin(angle) * radius;
        const y = Math.cos(angle) * radius;
        const z = -1;
    
        setOrbitPosition([x, y, z]);
      }, [currentTick])

    return <>
        <directionalLight intensity={timeOfDay == 'day' ? 1 : 0} position={lightOrbitPosition} color={0xffffff} />
        <directionalLight intensity={timeOfDay == 'night' ? 1 : 0} position={lightOrbitPosition} color={0xaaaaff} />
    </>
}