import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { TILE_GAP } from "./TileRenderer";
import { useTimeline } from "@/lib/contexts";
import { useCycle } from "@/lib/contexts";
import { Position } from "@/types/RoverContextTypes";


/**
 * Az algoritmus által kiszámolt út megjelenítése.
 */
export const PathDisplayer = () => {
  const { path } = useTimeline();
  const { currentTick } = useCycle();

  const { completedPoints, remainingPoints } = useMemo(() => {
  if (!Array.isArray(path) || path.length === 0) {
    return { completedPoints: [], remainingPoints: [] };
  }

  const height = 0.1;

  const completed: Position[] = [];
  const remaining: Position[] = [];

  for (let i = 0; i < path.length; i++) {
    const current = path[i];

    for (let j = 0; j < current.length; j++) {
      if (i <= currentTick) {
        completed.push(current[j]);
      } else {
        remaining.push(current[j]);
      }
    }
  }

  // kapcsolódjanak a vonalak
  if (completed.length > 0 && remaining.length > 0) {
    remaining.unshift(completed[completed.length - 1]);
  }

  return {
    completedPoints: completed.map(
      p => [p.x * TILE_GAP, height, p.y * TILE_GAP] as [number, number, number]
    ),
    remainingPoints: remaining.map(
      p => [p.x * TILE_GAP, height, p.y * TILE_GAP] as [number, number, number]
    )
  };
}, [path, currentTick]);

  if (!path || path.length < 2) return null;

  return (
    <>
      {completedPoints.length > 1 && (
        <Line
          points={completedPoints}
          color="orange"
          lineWidth={3}
          opacity={0.8}
          transparent
        />
      )}

      {remainingPoints.length > 1 && (
        <Line
          points={remainingPoints}
          color="blue"
          lineWidth={3}
          opacity={0.5}
          transparent
        />
      )}
    </>
  );
};