"use client"

import { useTimeline, useUIHelper } from "@/lib/contexts";
import { useMemo, useEffect, useState } from "react";

/**
 * Tartalom alapján színt ad a naplónak
 * @param message 
 * @returns tailwind szín osztály
 */
function getLogColor(message: string): string {
    if (message.includes("Kék")) return "text-cyan-500";
    if (message.includes("Zöld")) return "text-green-600";
    if (message.includes("Sárga")) return "text-orange-500";
    return "text-[#ffdda0]";
}

/**
 * A középen megjelenő legfrissebb pár napló sor.
 * @returns 
 */
function FreshLog({ message, color }: { message: string; color: string }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const id = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(id);
    }, []);

    return (
        <span className={`
            text-[1dwvw] font-mono wrap-break-word text-center block
            transition-all duration-300 ease-out
            text-shadow-lg text-shadow-black
            ${color}
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
        `}>
            {message}
        </span>
    );
}

const renderLog = (log: { message: string }, i: number) => {
    const color = getLogColor(log.message);
    return (
        <span key={i} className={`text-[0.8vw] font-mono wrap-break-word ${color}`}>
            {log.message}
        </span>
    );
};

export default function LogDisplayer() {
    const logs = useTimeline().rover.logs;
    const { resting, restingOpacity } = useUIHelper();

    const { logsToDisplay, freshLogs } = useMemo(() => {
        const ordered = [...logs].reverse();
        const fresh = logs.slice(Math.max(logs.length - 4, 0)).reverse();
        return { logsToDisplay: ordered, freshLogs: fresh };
    }, [logs]);

    return (
        <>
            <div
                className="
                    fixed bottom-2 right-2
                    w-[20vw] h-32 p-2
                    bg-[#1e1e2f]/90
                    border border-[#ff4500]
                    rounded-lg shadow-lg
                    flex flex-col gap-1
                    overflow-y-scroll overflow-x-hidden
                    text-xs font-mono text-[#ffdda0]
                    duration-200
                    hover:h-[50vh]
                "
                style={{ opacity: resting ? restingOpacity / 100 : 1 }}
            >
                {logsToDisplay.map(renderLog)}
            </div>

            <div
                className="fixed bottom-[18vh] left-1/2 -translate-x-1/2 w-[30vw] flex flex-col gap-0.5 overflow-hidden"
                style={{
                    maskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.3) 50%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.3) 50%, transparent 100%)",
                    opacity: resting ? restingOpacity / 100 : 1,
                }}
            >
                {freshLogs.map((log, i) => {
                    const stableKey = logs.length - freshLogs.length + i;
                    const color = getLogColor(log.message);
                    return <FreshLog key={stableKey} message={log.message} color={color} />;
                })}
            </div>
        </>
    );
}