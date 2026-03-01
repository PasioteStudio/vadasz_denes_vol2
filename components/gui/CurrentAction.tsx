"use client"

import { Position } from "@/types/RoverContextTypes";

export default function CurrentAction() {
    const position: Position = {x:0,y:0};
    return <div className="fixed bg-gray-50/30 top-36 right-0 grid">
        <p>Current action:</p>
        <p>Mining</p>
        <p>At: {position.x} ; {position.y}</p>
        <p>Energy usage: 12 e / tick</p>
    </div>
}