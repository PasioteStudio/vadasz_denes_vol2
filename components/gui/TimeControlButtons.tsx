"use client"
import { useCycle, useUIHelper } from "@/lib/contexts"

export default function TimeControlButtons(){
    const {resting, restingOpacity} = useUIHelper();
    const cycle = useCycle();
    const prev = ()=>{cycle.setTick(cycle.currentTick-1)};
    const next = ()=>{cycle.setTick(cycle.currentTick+1)};
    return <div className="fixed bottom-0 left-1/2 -translate-x-1/2 bg-gray-50/30 w-52 h-10 flex flex-col items-center justify-center"
    style={{
        opacity: resting ? restingOpacity/100 : 1
    }}>
        <div className="flex items-center gap-3">
            <button onClick={prev}>prev</button>
            <span>{cycle.currentTick}</span>
            <button onClick={next}>next</button>
        </div>
    </div>
}