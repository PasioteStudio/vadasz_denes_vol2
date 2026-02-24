"use client"
import { useCycle } from "@/lib/contexts"
import { useEffect, useRef } from "react";

export default function DayNightCycleDisplayer() {
    const { timeOfDay, currentTick } = useCycle();
    const canvas = useRef<HTMLCanvasElement>(null);
    const percentX = (p: number) => canvas.current!.width * p;
    const percentY = (p: number) => canvas.current!.height * p;

    const drawBaseArc = (ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.moveTo(percentX(0), percentY(0.4));
        ctx.quadraticCurveTo(
            percentX(0), percentY(1),
            percentX(0.6), percentY(1)
        );
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    const drawProgressArc = (ctx: CanvasRenderingContext2D, progress: number) => {
        const P0 = { x: percentX(0), y: percentY(0.4) };
        const P1 = { x: percentX(0), y: percentY(1) };
        const P2 = { x: percentX(0.6), y: percentY(1) };
        const t = Math.max(0, Math.min(1, progress)); // Clamp between 0 and 1

        ctx.beginPath();
        ctx.moveTo(P0.x, P0.y);
        let last = [P0.x, P0.y]; // Initialize with start point

        for (let i = 0; i <= t; i += 0.01) {
            const s = Math.min(i, t);
            const x = Math.pow(1 - s, 2) * P0.x + 2 * (1 - s) * s * P1.x + Math.pow(s, 2) * P2.x;
            const y = Math.pow(1 - s, 2) * P0.y + 2 * (1 - s) * s * P1.y + Math.pow(s, 2) * P2.y;
            ctx.lineTo(x, y);
            last = [x, y];
        }
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw circle at end of arc
        ctx.beginPath();
        ctx.arc(last[0], last[1], Math.min(percentX(0.04), percentY(0.04)), 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = "red";
        ctx.fill();
    }

    useEffect(() => {
        if (!canvas.current) return;
        const ctx = canvas.current.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
        drawBaseArc(ctx);
        drawProgressArc(ctx, 0.6); // Hardcoded 60% progress
    });

    return (
        <div className="fixed top-0 right-0 aspect-square h-1/8 flex items-center justify-center">
            <canvas
                className="absolute h-full w-full top-0 left-0 aspect-square"
                ref={canvas}
                width={300}
                height={300}
            />
            <img src={timeOfDay == "day" ? "/cycle/cycle-day.png" : "/cycle/cycle-night.png"} className="w-10/12 h-10/12" />
        </div>
    );
}