"use client"
import { useUIHelper } from "@/lib/contexts"

export default function TimeControlButtons(){
    const {resting, restingOpacity} = useUIHelper();
    return <div className="fixed bottom-0 left-1/2 -translate-x-1/2 bg-gray-50/30 w-52 h-10 flex flex-col items-center justify-center"
    style={{
        opacity: resting ? restingOpacity/100 : 1
    }}>
        <div className="flex items-center gap-3">
            <img src="/time/double.png" />
            <img src="/time/single.png" />
            <img src="/time/pause.png" />
            <img src="/time/single.png" />
            <img src="/time/double.png" />
        </div>
    </div>
}