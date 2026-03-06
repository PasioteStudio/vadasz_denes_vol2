"use client"

import { useCycle, useTimeline, useUIHelper } from "@/lib/contexts";

export default function CurrentAction() {
    const { currentTick } = useCycle();
    const currentAction = "TODO FROM DELTAS"
    const { resting, restingOpacity } = useUIHelper();

    const actionMap: Record<string, string> = {
        move: "mozgás",
        mine: "bányászás",
        wait: "alapjárat",
    };
    const pos = useTimeline().rover.position;

    return (
        <div
            className={`
        fixed top-1/4 right-2
        w-36 p-2
        bg-[#1e1e2f]/90 border border-[#ff4500]
        rounded-lg shadow-lg
        text-[#ffdda0] font-mono
        flex flex-col gap-1
      `}
            style={{ opacity: resting ? restingOpacity / 100 : 1 }}
        >
            <p className="text-sm font-semibold my-0">Jelenleg:</p>
            <p className="text-sm mb-3 my-0">{actionMap[currentAction] ?? currentAction}</p>
            <p className="text-xs">Pozíció: {pos.x} ; {pos.y}</p>
            <p className="text-xs">fogyasztás: TODO</p>
        </div>
    );
}