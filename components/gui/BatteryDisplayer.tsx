"use client"
import { useRover, useUIHelper } from "@/lib/contexts"
import { MouseEvent, useState } from "react";

export default function BatteryDisplayer() {
    const { energy } = useRover();
    const [position, setPosition] = useState({ x: -100, y: -100 });
    const {resting, restingOpacity} = useUIHelper();
    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        setPosition({ x: e.clientX, y: e.clientY });
    };
    return <div className={`fixed top-2 left-2 h-1/24 w-2/12 flex items-center justify-center group`} onMouseMove={(e) => { handleMouseMove(e) }} onMouseOut={() => { setPosition({ x: -100, y: -100 }) }}
    style={{
        opacity: resting ? restingOpacity/100 : 1
    }}>
        <img src="/battery.png" className=" h-full mr-2" />
        <div className="h-6/12 grow overflow-hidden flex justify-start gap-2">
            {Array.from({ length: Math.round(energy / 10) }).map((x, i) => <div key={i} className="w-1/10 h-full bg-green-900"></div>)}
        </div>
        <div className={`hidden group-hover:block absolute top-full left-full px-2 rounded-sm`} style={{
            position: 'fixed',
            left: `${position.x + 30}px`,
            top: `${position.y + 30}px`,
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            background: `linear-gradient(90deg, #0d542b ${(energy/100)*100}%, transparent)`
        }}
        >
            <span>{energy}/100</span>
        </div>
    </div>
}