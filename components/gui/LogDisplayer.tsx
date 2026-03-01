"use client"

import { useCycle, useSnapshots } from "@/lib/contexts";
import { Log } from "@/types/RoverContextTypes";
import { useMemo } from "react";

export default function LogDisplayer(){
    const  {currentTick} = useCycle();
    const logs = useSnapshots().snapshots.get(currentTick)!.rover.logs;
    const {logsToDisplay, freshLogs} = useMemo(()=>{
        const ordered = [...logs].reverse();
        const fresh = logs.slice(Math.max(ordered.length-4,0)).reverse();
        return {logsToDisplay:ordered, freshLogs:fresh};
    }, [logs])
    return <>
        <div className="fixed bottom-0 right-0 bg-gray-50/30 w-102 h-[60vh] translate-y-8/12 hover:translate-y-0 duration-120 flex flex-col items-start justify-start overflow-y-scroll overflow-x-hidden *:w-max">
            {logsToDisplay.map((l,i) => <span key={i}>{l.message}</span> )}
        </div>
        <div className="bottom-[14vh] left-1/2 -translate-x-1/2 fixed h-[3vw] overflow-y-hidden flex flex-col w-[30vw] items-center 
        mask-[linear-gradient(to_bottom,black_0%,rgba(0,0,0,0.3)_50%,transparent_100%)]">
            {freshLogs.map((l,i) => <span key={i} className="text-[0.8vw]">{l.message}</span>)}
        </div>
    </>
}