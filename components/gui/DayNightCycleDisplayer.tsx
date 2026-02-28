"use client"
import { useCycle, useUIHelper } from "@/lib/contexts"
import { useEffect, useRef } from "react";

export default function DayNightCycleDisplayer() {
    const { timeOfDay, currentTick } = useCycle();
    const { resting, restingOpacity } = useUIHelper();
    const canvas = useRef<HTMLCanvasElement>(null);

    const getCircle = () => {
        const w = canvas.current!.width;
        const h = canvas.current!.height;
        const radius = Math.min(w, h) * 0.43;

        return {
            cx: w / 2,
            cy: h / 2,
            r: radius
        };
    };

    const drawBaseArc = (ctx: CanvasRenderingContext2D) => {
        const { cx, cy, r } = getCircle();

        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI * 0.7, Math.PI * 0.3, true);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    const drawProgressArc = (ctx: CanvasRenderingContext2D, progress: number) => {
        const { cx, cy, r } = getCircle();

        const start = -Math.PI * 0.7;
        const end = start - progress * Math.PI;

        const style = timeOfDay == "day" ? "orange" : "rgb(96 83 207)";

        ctx.beginPath();
        ctx.arc(cx, cy, r, start, end, true);
        ctx.strokeStyle = style;
        ctx.lineWidth = 2;
        ctx.stroke();

        const x = cx + r * Math.cos(end);
        const y = cy + r * Math.sin(end);

        ctx.beginPath();
        ctx.arc(x, y, r * 0.08, 0, 2 * Math.PI, true);
        ctx.fillStyle = style;
        ctx.fill();
    };

    const getProgress = (): number => {
        const current = currentTick % (24 * 2);

        const periodLength = timeOfDay == "day" ? 16 * 2 : 8 * 2;

        const adjusted = timeOfDay == "night"
            ? current - 16 * 2
            : current;

        return Math.max(0, Math.min(1, adjusted / periodLength));
    };

    useEffect(() => {
        if (!canvas.current) return;

        const ctx = canvas.current.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);

        drawBaseArc(ctx);
        drawProgressArc(ctx, getProgress());
    });

    return (
        <div
            className="fixed top-0 right-0 aspect-square h-2/12 flex items-center justify-center"
            style={{
                opacity: resting ? restingOpacity / 100 : 1
            }}
        >
            <canvas
                className="absolute h-full w-full top-0 left-0 aspect-square"
                ref={canvas}
                width={300}
                height={300}
            />
            <img
                src={timeOfDay == "day"
                    ? "/cycle/cycle-day.png"
                    : "/cycle/cycle-night.png"}
                className="w-9/12 h-9/12"
            />
        </div>
    );
}