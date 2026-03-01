"use client"

import { useCycle, useSnapshots } from "@/lib/contexts";
import { Log } from "@/types/RoverContextTypes";
import { useMemo } from "react";

export default function LogDisplayer(){
    const  {currentTick} = useCycle();
    const logs = useSnapshots().snapshots.get(currentTick)!.rover.logs;
    const logsToDisplay = useMemo(()=>{
        return [...logs].reverse();
    }, [logs])
    return <>
        <div className="fixed bottom-0 right-0 bg-gray-50/30 w-102 h-[60vh] translate-y-8/12 hover:translate-y-0 duration-120 flex flex-col items-start justify-start overflow-y-scroll overflow-x-hidden *:w-max">
            {logsToDisplay.map((l,i) => <span key={i}>{l.message}</span> )}
        </div>
        <div className="bottom-22 left-1/2 -translate-x-1/2 fixed max-h-20 overflow-y-hidden">
            {logsToDisplay.slice(Math.max(logs.length-4, 1), 4).map((l,i) => <span key={i}>{l.message}</span>)}
            <div className="bg-linear-0 from-black from-20% to-transparent to-70% z-20 absolute top-0 left-0 w-full h-full"></div>
        </div>
    </>
}