"use client";

import { useCycle, useUIHelper } from "@/lib/contexts";
import { MouseEvent, useEffect, useCallback, useRef, memo } from "react";

type Step = 1 | 2 | -1 | -2 | -3;

const getIcon = (type: "single" | "double" | "snap") =>
  type === "single"
    ? "/time/single.png"
    : type === "snap"
      ? "/time/snap.png"
      : "/time/double.png";

const getFilter = (active: boolean) =>
  active
    ? "invert(50%) sepia(100%) saturate(800%) hue-rotate(15deg) brightness(1.2)"
    : "invert(100%)";

const Icon = memo(function Icon({
  amount,
  type,
  active,
}: {
  amount: 1 | 2 | -1 | -2;
  type: "single" | "double" | "snap";
  active: boolean;
}) {
  return (
    <img
      src={getIcon(type)}
      className={`w-6 aspect-square ${amount > 0 ? "rotate-180" : ""}`}
      style={{ filter: getFilter(active) }}
    />
  );
});

export default function TimeControlButtons() {
  const { resting, restingOpacity } = useUIHelper();
  const cycle = useCycle();

  const cycleRef = useRef(cycle);
  useEffect(() => { cycleRef.current = cycle; });

  const isPlaying = cycle.player.playing === "playing";
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; });

  const handleButton = useCallback(
    (amount: Step, e?: MouseEvent<HTMLButtonElement>) => {
      e?.currentTarget.blur();
      const c = cycleRef.current;

      if (amount === -3) {
        c.player.setSnapToggle(!c.player.snapToggle);
        return;
      }

      const isDouble = Math.abs(amount) === 2;
      c.setDirection(amount > 0 ? 1 : -1);
      c.player.setSpeed(amount);

      if (!isPlayingRef.current && !isDouble) {
        c.setTick(c.currentTick + amount);
      }
    },
    []
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const c = cycleRef.current;
      if (e.code === "Space") {
        c.player.setPlaying(isPlayingRef.current ? "paused" : "playing");
      } else if (e.code === "ArrowRight") handleButton(1);
      else if (e.code === "ArrowLeft") handleButton(-1);
      else if (e.code === "ControlLeft" && c.player.speed === 1) handleButton(2);
      else if (e.code === "ControlLeft" && c.player.speed === -1) handleButton(-2);
      else if (e.key.toLowerCase() === "q") handleButton(-3);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleButton]);

  const baseBtn = "cursor-pointer hover:bg-[#ff4500]/20 p-1 rounded";
  const speed = cycle.player.speed;
  const snapToggle = cycle.player.snapToggle;

  return (
    <div
      className="fixed bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center rounded-lg border-2 border-[#ff4500] bg-[#1e1e2f]/80 p-3 shadow-lg backdrop-blur"
      style={{ opacity: resting ? restingOpacity / 100 : 1 }}
    >
      <p className="absolute bottom-full left-1/2 mb-1 w-max -translate-x-1/2 text-xs font-mono text-[#ffdda0]">
        Eltelt: {cycle.currentTick / 2} / {cycle.timeLimit / 2} óra
      </p>

      <div className="flex items-center gap-2">
        <div className="absolute left-[-25%] -translate-x-1/2 flex items-center justify-center rounded-lg border-2 border-[#ff4500] bg-[#1e1e2f]/80 p-3 shadow-lg">
          <button title="Q" className={baseBtn} onClick={(e) => handleButton(-3, e)}>
            <Icon amount={-2} type="snap" active={snapToggle} />
          </button>
        </div>

        <button title="<- + Ctrl" className={baseBtn} onClick={(e) => handleButton(-2, e)}>
          <Icon amount={-2} type="double" active={speed === -2} />
        </button>

        <button title="<-" className={baseBtn} onClick={(e) => handleButton(-1, e)}>
          <Icon amount={-1} type="single" active={speed === -1} />
        </button>

        <button
          title="⌞___⌟"
          onClick={(e) => {
            cycleRef.current.player.setPlaying(isPlayingRef.current ? "paused" : "playing");
            e.currentTarget.blur();
          }}
          className="cursor-pointer rounded-full bg-[#ff4500]/10 p-2 hover:bg-[#ff4500]/30"
        >
          <img
            src={isPlaying ? "/time/pause.png" : "/time/play.png"}
            className="w-6 aspect-square invert"
          />
        </button>

        <button title="->" className={baseBtn} onClick={(e) => handleButton(1, e)}>
          <Icon amount={1} type="single" active={speed === 1} />
        </button>

        <button title="-> + Ctrl" className={baseBtn} onClick={(e) => handleButton(2, e)}>
          <Icon amount={2} type="double" active={speed === 2} />
        </button>
      </div>
    </div>
  );
}