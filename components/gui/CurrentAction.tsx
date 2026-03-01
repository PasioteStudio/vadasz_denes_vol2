"use client"

import { useCycle, useSnapshots } from "@/lib/contexts";
import { Position } from "@/types/RoverContextTypes";

export default function CurrentAction() {
    const  {currentTick} = useCycle();
    const snap = useSnapshots().snapshots.get(currentTick)!;
    const currentAction = snap.rover.currentAction;

    return <div className="fixed bg-gray-50/30 top-2/8 right-0 grid">
        <p>Jelenleg:</p>
        <p>{currentAction.action}</p>
        <p>At: {snap.rover.position.x} ; {snap.rover.position.y}</p>
        <p>Energy usage: TODO</p>
    </div>
}