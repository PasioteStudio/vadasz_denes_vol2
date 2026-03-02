"use client"
import { useCycle, useUIHelper } from "@/lib/contexts"
import { useEffect } from "react";

export default function TimeControlButtons() {
    const { resting, restingOpacity } = useUIHelper();
    const cycle = useCycle();

    useEffect(() => {
        const interval = setInterval(() => {
            if (cycle.player.playing != "playing" || cycle.isInAnimation) return;
            cycle.setTick(cycle.currentTick + 1);
        }, 350 / cycle.player.speed)

        return () => { clearInterval(interval) };
    }, [cycle.player])

    const prev = (amount = 1) => {
        if (cycle.player.playing == "playing") {
            cycle.player.setSpeed(-amount as 1 | 2 | -1 | -2);
            return;
        }
        cycle.setTick(cycle.currentTick - amount);
    };

    const next = (amount = 1) => {
        if (cycle.player.playing == "playing") {
            cycle.player.setSpeed(amount as 1 | 2 | -1 | -2);
            return;
        }
        cycle.setTick(cycle.currentTick + amount);
    };


    return <div className="fixed bottom-0 left-1/2 -translate-x-1/2 bg-gray-50/30 w-max h-1/24 flex flex-col items-center justify-center"
        style={{
            opacity: resting ? restingOpacity / 100 : 1
        }}>
        <p className="absolute bottom-full left-0">Eltelt idő: {cycle.currentTick/2} / {cycle.timeLimit/2} óra</p>
        <div className="flex items-center gap-[0.5vw]">
            <button onClick={() => { prev(2) }} className="cursor-pointer"><img src="/time/double.png" className="w-[2vw] aspect-square invert" /></button>
            <button onClick={() => { prev(1) }} className="cursor-pointer"><img src="/time/single.png" className="w-[2vw] aspect-square invert" /></button>

            <button onClick={() => { cycle.player.setPlaying(cycle.player.playing == "playing" ? "paused" : "playing") }} className="cursor-pointer">
                {cycle.player.playing != "playing" ?
                    <img src="/time/play.png" className=" aspect-square invert" />
                    :
                    <img src="/time/pause.png" className=" aspect-square invert" />
                }
            </button>

            <button onClick={() => { next(1) }} className="cursor-pointer"><img src="/time/single.png" className="w-[2vw] aspect-square invert rotate-180" /></button>
            <button onClick={() => { next(2) }} className="cursor-pointer"><img src="/time/double.png" className="w-[2vw] aspect-square invert rotate-180" /></button>
        </div>
    </div>
}