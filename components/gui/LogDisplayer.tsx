"use client"

import { useCycle, useSnapshots } from "@/lib/contexts";
import { useMemo } from "react";

export default function LogDisplayer() {
  const { currentTick } = useCycle();
  const logs = useSnapshots().snapshots.get(currentTick)?.rover.logs ?? [];

  const { logsToDisplay, freshLogs } = useMemo(() => {
    const ordered = [...logs].reverse();
    const fresh = logs.slice(Math.max(logs.length - 4, 0)).reverse();
    return { logsToDisplay: ordered, freshLogs: fresh };
  }, [logs]);

  const renderLog = (log: { message: string }, i: number) => (
    <span key={i} className="text-[0.8vw] font-mono wrap-break-word text-[#ffdda0] text-center">
      {log.message}
    </span>
  );

  return (
    <>
      {/* Bottom-right log panel (minimized → expands on hover) */}
      <div
        className="
          fixed bottom-2 right-2
          w-28 h-32
          p-2
          bg-[#1e1e2f]/90
          border border-[#ff4500]
          rounded-lg
          shadow-lg
          flex flex-col
          gap-1
          overflow-y-auto
          overflow-x-hidden
          text-xs font-mono
          text-[#ffdda0]
          duration-200
          hover:w-96 hover:h-[60vh]
        "
      >
        {logsToDisplay.map(renderLog)}
      </div>

      {/* Floating recent logs above the main panel */}
      <div
        className="fixed bottom-[18vh] left-1/2 -translate-x-1/2 w-[30vw] flex flex-col gap-0.5 overflow-hidden"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.3) 50%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.3) 50%, transparent 100%)",
        }}
      >
        {freshLogs.map(renderLog)}
      </div>
    </>
  );
}