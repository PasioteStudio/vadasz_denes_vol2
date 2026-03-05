"use client"
import { useCycle, useSnapshots, useUIHelper } from "@/lib/contexts";
import { MouseEvent, useState } from "react";

export default function BatteryDisplayer() {
    const { currentTick } = useCycle();
    const snapshots = useSnapshots().snapshots;
    const energy = snapshots.get(currentTick)?.rover.energy ?? 0;
    const [position, setPosition] = useState({ x: -100, y: -100 });
    const { resting, restingOpacity } = useUIHelper();

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        setPosition({ x: e.clientX, y: e.clientY });
    };

    const segments = 10;
    const fullSegments = Math.floor((energy / 100) * segments);
    const partialSegmentFraction = (energy / 100) * segments - fullSegments;

    return (
        <div
            className="fixed top-2 left-2 w-48 h-10 flex items-center p-2 bg-[#1e1e2f]/90 border border-[#ff4500] rounded-lg shadow-lg group"
            style={{ opacity: resting ? restingOpacity / 100 : 1 }}
            onMouseMove={handleMouseMove}
            onMouseOut={() => setPosition({ x: -100, y: -100 })}
        >
            {/* Battery icon */}
            <img src="/battery.png" className="h-full mr-2" />

            {/* Battery segments */}
            <div className="flex grow h-4 justify-start rounded bg-[#0b1a0f] overflow-hidden gap-1">
                {Array.from({ length: segments }).map((_, i) => {
                    if (i < fullSegments) {
                        // Fully filled segments
                        return <div key={i} className="flex-1 h-full rounded-sm bg-[#0f9d58]"></div>;
                    } else if (i === fullSegments && partialSegmentFraction > 0) {
                        // Partial segment: inner div controls width
                        return (
                            <div key={i} className="flex-1 h-full rounded-sm bg-[#143222] relative overflow-hidden">
                                <div
                                    className="h-full bg-[#0f9d58] rounded-sm"
                                    style={{ width: `${partialSegmentFraction * 100}%` }}
                                ></div>
                            </div>
                        );
                    } else {
                        // Empty segments
                        return <div key={i} className="flex-1 h-full rounded-sm bg-[#143222]"></div>;
                    }
                })}
            </div>

            {/* Tooltip on hover */}
            <div
                className="hidden group-hover:flex items-center justify-center px-2 py-1 rounded-sm text-xs font-mono text-[#ffdda0] shadow-md"
                style={{
                    position: "fixed",
                    left: `${position.x + 15}px`,
                    top: `${position.y + 25}px`,
                    pointerEvents: "none",
                    background: "#1e1e2f",
                    border: "1px solid #ff4500",
                }}
            >
                {energy}/100
            </div>
        </div>
    );
}