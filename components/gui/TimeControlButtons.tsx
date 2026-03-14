"use client"
import { useCycle, useUIHelper } from "@/lib/contexts";

export default function TimeControlButtons() {
  const { resting, restingOpacity } = useUIHelper();
  const cycle = useCycle();

  const handleButton = (amount: 1 | 2 | -1 | -2) => {
    const isDouble = Math.abs(amount) === 2;
    cycle.setDirection(amount > 0 ? 1 : -1)

    if (cycle.player.playing === "playing" || isDouble) {
      // Playing or double-step button: only set speed
      cycle.player.setSpeed(amount);
    } else {
      // Paused + single-step: set speed AND adjust tick
      cycle.player.setSpeed(amount);
      cycle.setTick(cycle.currentTick + amount);
    }
  };

  const renderButtonContent = (amount: 1 | 2 | -1 | -2, type: "single" | "double") => {
    const baseIcon = type === "single" ? "/time/single.png" : "/time/double.png";
    const rotate = amount > 0 ? "rotate-180" : "";

    // Filter to color chevron based on active speed
    const isActive = cycle.player.speed === amount;
    const filter = isActive
      ? "invert(50%) sepia(100%) saturate(800%) hue-rotate(15deg) brightness(1.2)" // orange-ish
      : "invert(100%)"; // default white

    return (
      <img
        src={baseIcon}
        className={`w-6 aspect-square ${rotate}`}
        style={{ filter }}
      />
    );
  };

  return (
    <div
      className="fixed bottom-2 left-1/2 -translate-x-1/2 bg-[#1e1e2f]/80 border-2 border-[#ff4500] rounded-lg p-3 shadow-lg flex flex-col items-center justify-center"
      style={{
        opacity: resting ? restingOpacity / 100 : 1,
        backdropFilter: "blur(6px)",
      }}
    >
      <p className="absolute bottom-full left-1/2 -translate-x-1/2 text-xs font-mono text-[#ffdda0] mb-1 w-max">
        Eltelt: {cycle.currentTick / 2} / {cycle.timeLimit / 2} óra
      </p>

      <div className="flex items-center gap-2">
        {/* Backward Buttons */}
        <button onClick={() => handleButton(-2)} className="cursor-pointer hover:bg-[#ff4500]/20 p-1 rounded">
          {renderButtonContent(-2, "double")}
        </button>
        <button onClick={() => handleButton(-1)} className="cursor-pointer hover:bg-[#ff4500]/20 p-1 rounded">
          {renderButtonContent(-1, "single")}
        </button>

        {/* Play/Pause */}
        <button
          onClick={() =>
            cycle.player.setPlaying(
              cycle.player.playing === "playing" ? "paused" : "playing"
            )
          }
          className="cursor-pointer bg-[#ff4500]/10 hover:bg-[#ff4500]/30 p-2 rounded-full"
        >
          {cycle.player.playing !== "playing" ? (
            <img src="/time/play.png" className="w-6 aspect-square invert" />
          ) : (
            <img src="/time/pause.png" className="w-6 aspect-square invert" />
          )}
        </button>

        {/* Forward Buttons */}
        <button onClick={() => handleButton(1)} className="cursor-pointer hover:bg-[#ff4500]/20 p-1 rounded">
          {renderButtonContent(1, "single")}
        </button>
        <button onClick={() => handleButton(2)} className="cursor-pointer hover:bg-[#ff4500]/20 p-1 rounded">
          {renderButtonContent(2, "double")}
        </button>
      </div>
    </div>
  );
}