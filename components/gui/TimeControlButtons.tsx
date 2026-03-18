"use client";

import { useCycle, useUIHelper } from "@/lib/contexts";
import { MouseEvent, useEffect, useCallback } from "react";

type Step = 1 | 2 | -1 | -2 | -3;


/**
 * A lejátszó
 */
export default function TimeControlButtons() {
  const { resting, restingOpacity } = useUIHelper();
  const cycle = useCycle();

  const isPlaying = cycle.player.playing === "playing";

  const handleButton = useCallback(
    (amount: Step, e?: MouseEvent<HTMLButtonElement>) => {
      e?.currentTarget.blur();

      // Q betű lenyomása: "snap to rover"
      if (amount === -3) {
        cycle.player.setSnapToggle(!cycle.player.snapToggle);
        return;
      }

      // Ciklus kontextusban a tick beállítása (safe)
      const isDouble = Math.abs(amount) === 2;

      cycle.setDirection(amount > 0 ? 1 : -1);
      cycle.player.setSpeed(amount);

      if (!isPlaying && !isDouble) {
        cycle.setTick(cycle.currentTick + amount);
      }
    },
    [cycle, isPlaying]
  );

  // Billentyűzettel való irányítás
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        cycle.player.setPlaying(isPlaying ? "paused" : "playing");
      } else if (e.code === "ArrowRight") handleButton(1);
      else if (e.code === "ArrowLeft") handleButton(-1);
      else if (e.code === "ControlLeft" && cycle.player.speed === 1) handleButton(2);
      else if (e.code === "ControlLeft" && cycle.player.speed === -1) handleButton(-2);
      else if (e.key.toLowerCase() === "q") handleButton(-3);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycle, handleButton, isPlaying]);

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

  // BELSŐ HELPER, mert lusta voltam exportálni egy külön színű svg-t... nagyon csúnya, de a lustaság fél egészség.
  const Icon = ({
    amount,
    type,
  }: {
    amount: 1 | 2 | -1 | -2;
    type: "single" | "double" | "snap";
  }) => {
    const active =
      type === "snap"
        ? cycle.player.snapToggle
        : cycle.player.speed === amount;

    return (
      <img
        src={getIcon(type)}
        className={`w-6 aspect-square ${amount > 0 ? "rotate-180" : ""}`}
        style={{ filter: getFilter(active) }}
      />
    );
  };

  const baseBtn =
    "cursor-pointer hover:bg-[#ff4500]/20 p-1 rounded";

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
          <button
            title="Q"
            className={baseBtn}
            onClick={(e) => handleButton(-3, e)}
          >
            <Icon amount={-2} type="snap" />
          </button>
        </div>

        <button
          title="<- + Ctrl"
          className={baseBtn}
          onClick={(e) => handleButton(-2, e)}
        >
          <Icon amount={-2} type="double" />
        </button>

        <button
          title="<-"
          className={baseBtn}
          onClick={(e) => handleButton(-1, e)}
        >
          <Icon amount={-1} type="single" />
        </button>

        <button
          title="⌞___⌟"
          onClick={(e) => {
            cycle.player.setPlaying(isPlaying ? "paused" : "playing");
            e.currentTarget.blur();
          }}
          className="cursor-pointer rounded-full bg-[#ff4500]/10 p-2 hover:bg-[#ff4500]/30"
        >
          <img
            src={isPlaying ? "/time/pause.png" : "/time/play.png"}
            className="w-6 aspect-square invert"
          />
        </button>

        <button
          title="->"
          className={baseBtn}
          onClick={(e) => handleButton(1, e)}
        >
          <Icon amount={1} type="single" />
        </button>

        <button
          title="-> + Ctrl"
          className={baseBtn}
          onClick={(e) => handleButton(2, e)}
        >
          <Icon amount={2} type="double" />
        </button>
      </div>
    </div>
  );
}