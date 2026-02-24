"use client"
import { useRover } from "@/lib/contexts"

export default function CurrentAction() {
    const position = useRover().position.get;
    return <div className="fixed bg-gray-50/30 top-36 right-0 grid">
        <p>Current action:</p>
        <p>Mining</p>
        <p>At: {position.x} ; {position.y}</p>
        <p>Energy usage: 12 e / tick</p>
    </div>
}