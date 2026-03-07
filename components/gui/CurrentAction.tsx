"use client"

import { useCycle, useTimeline, useUIHelper } from "@/lib/contexts";

export default function CurrentAction() {
    const { currentTick } = useCycle();
    const { deltas, rover } = useTimeline();
    const { resting, restingOpacity } = useUIHelper();

    if (deltas.length === 0) return null;

    const moves = deltas[deltas.length - 1].moves;
    const currentAction = moves[moves.length - 1];
    const pos = rover.position;

    const actionMap: Record<string, string> = {
        move: "mozgás",
        mine: "bányászás",
        wait: "alapjárat",
    };

    return (
        <div
            className={`
        fixed top-1/4 right-2
        w-max p-2
        bg-[#1e1e2f]/90 border border-[#ff4500]
        rounded-lg shadow-lg
        text-[#ffdda0] font-mono
        flex flex-col gap-1
      `}
            style={{ opacity: resting ? restingOpacity / 100 : 1 }}
        >
            <p className="text-sm w-max font-semibold my-0">Jelenleg:</p>
            <p className="text-sm w-max mb-3 my-0">{actionMap[currentAction.mode] ?? currentAction.mode}</p>
            <p className="text-xs w-max">Cél Pozíció: {pos.x}, {pos.y}</p>
            <p className="text-xs w-max">fogyasztás: TODO</p>
        </div>
    );
}