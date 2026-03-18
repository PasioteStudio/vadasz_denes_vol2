"use client";

import { useCycle, useUIHelper } from "@/lib/contexts";
import { useEffect, useRef, useMemo } from "react";

/**
 * Jobb felső sarok, éj-nap ciklus ábrázolása
 */
export default function DayNightCycleDisplayer() {
    const { timeOfDay, currentTick } = useCycle();
    const { resting, restingOpacity } = useUIHelper();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const isDay = timeOfDay === "day";

    const progress = useMemo(() => {
        const current = currentTick % (24 * 2);

        const periodLength = isDay ? 16 * 2 : 8 * 2;
        const adjusted = isDay ? current : current - 16 * 2;

        return Math.max(0, Math.min(1, adjusted / periodLength));
    }, [currentTick, isDay]);

    const color = isDay ? "orange" : "rgb(96 83 207)";

    // HELPER FUNKCIÓK

    const getCircle = (canvas: HTMLCanvasElement) => {
        const { width: w, height: h } = canvas;
        const r = Math.min(w, h) * 0.43;

        return { cx: w / 2, cy: h / 2, r };
    };

    const drawBaseArc = (ctx: CanvasRenderingContext2D, circle: ReturnType<typeof getCircle>) => {
        const { cx, cy, r } = circle;

        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI * 0.7, Math.PI * 0.3, true);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    const drawProgressArc = (
        ctx: CanvasRenderingContext2D,
        circle: ReturnType<typeof getCircle>,
        progress: number
    ) => {
        const { cx, cy, r } = circle;

        const start = -Math.PI * 0.7;
        const end = start - progress * Math.PI;

        // Körív
        ctx.beginPath();
        ctx.arc(cx, cy, r, start, end, true);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // A Nap pontja (legalább is nappal Nap.)
        const x = cx + r * Math.cos(end);
        const y = cy + r * Math.sin(end);

        ctx.beginPath();
        ctx.arc(x, y, r * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    };

    // RAJZOLÁS

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const circle = getCircle(canvas);

        drawBaseArc(ctx, circle);
        drawProgressArc(ctx, circle, progress);
    }, [progress, color]);

    // MEGJELENÍTÉS

    return (
        <div
            className="fixed top-0 right-0 flex aspect-square h-5/24 items-center justify-center"
            style={{ opacity: resting ? restingOpacity / 100 : 1 }}
        >
            <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="absolute inset-0 h-full w-full aspect-square"
            />

            <img
                src={isDay ? "/cycle/cycle-day.png" : "/cycle/cycle-night.png"}
                className="h-9/12 w-9/12"
                alt={isDay ? "Day" : "Night"}
            />
        </div>
    );
}