"use client"
import { useCycle, useUIHelper } from "@/lib/contexts"
import { useEffect, useRef } from "react";

export default function DayNightCycleDisplayer() {
    const { timeOfDay, currentTick } = useCycle();
    const canvas = useRef<HTMLCanvasElement>(null);
    const percentX = (p: number) => canvas.current!.width * p;
    const percentY = (p: number) => canvas.current!.height * p;
    const { resting, restingOpacity } = useUIHelper();
    const drawBaseArc = (ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.moveTo(percentX(0.07), percentY(0.5));
        ctx.quadraticCurveTo(
            percentX(0.1), percentY(0.9),
            percentX(0.5), percentY(0.93)
        );
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    const drawProgressArc = (ctx: CanvasRenderingContext2D, progress: number) => {
        const P0 = { x: percentX(0.07), y: percentY(0.5) };
        const P1 = { x: percentX(0.1), y: percentY(0.9) };
        const P2 = { x: percentX(0.5), y: percentY(0.93) };
        const t = Math.max(0, Math.min(1, progress));

        ctx.beginPath();
        ctx.moveTo(P0.x, P0.y);
        let last = [P0.x, P0.y];

        for (let i = 0; i <= t; i += 0.01) {
            const s = Math.min(i, t);
            const x = Math.pow(1 - s, 2) * P0.x + 2 * (1 - s) * s * P1.x + Math.pow(s, 2) * P2.x;
            const y = Math.pow(1 - s, 2) * P0.y + 2 * (1 - s) * s * P1.y + Math.pow(s, 2) * P2.y;
            ctx.lineTo(x, y);
            last = [x, y];
        }
        const style = timeOfDay == "day" ? "orange" : "rgb(96 83 207)";
        ctx.strokeStyle = style;
        ctx.lineWidth = 2;
        ctx.stroke();


        ctx.beginPath();
        ctx.arc(last[0], last[1], Math.min(percentX(0.04), percentY(0.04)), 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = style;
        ctx.fill();
    }

    useEffect(() => {
        if (!canvas.current) return;
        const ctx = canvas.current.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
        drawBaseArc(ctx);
        drawProgressArc(ctx, getProgress());
    });

    const getProgress = (): number => {
        const current = currentTick % (24 * 2)
        const periodLength = timeOfDay == "day" ? 16 * 2 : 8 * 2;
        const c2 = timeOfDay == "night" ? current - 16 * 2 : current;
        return c2 / periodLength;
    }

    return (
        <div className="fixed top-0 right-0 aspect-square h-1/8 flex items-center justify-center"
            style={{
                opacity: resting ? restingOpacity / 100 : 1
            }}>
            <canvas
                className="absolute h-full w-full top-0 left-0 aspect-square"
                ref={canvas}
                width={300}
                height={300}
            />
            <img src={timeOfDay == "day" ? "/cycle/cycle-day.png" : "/cycle/cycle-night.png"} className="w-9/12 h-9/12" />
        </div>
    );
}