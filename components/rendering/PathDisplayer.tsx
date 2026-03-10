import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { Position } from "@/types/RoverContextTypes";
import { TILE_GAP } from "./TileRenderer";
import { useTimeline } from "@/lib/contexts";

export const PathDisplayer = () => {
  const { path, rover } = useTimeline();

  const { completedpoints, rest } = useMemo(() => {
    if (!Array.isArray(path)) return { completedpoints: [], rest: [] };

    const completed: [number, number, number][] = [];
    const nocaught: [number, number, number][] = [];
    const currentPos = rover.position;
    const height = 0.3;

    let caughtRover = false;

    for (let i = 0; i < path.length; i++) {
      const currentPoint = path[i];

      if (caughtRover) {
        // after rover → not yet completed
        nocaught.push([
          currentPoint.x * TILE_GAP,
          height,
          currentPoint.y * TILE_GAP,
        ]);
      } else {
        // before rover → completed
        completed.push([
          currentPoint.x * TILE_GAP,
          height,
          currentPoint.y * TILE_GAP,
        ]);
      }

      // Check **after** pushing: switch happens at rover
      if (currentPoint.x === currentPos.x && currentPoint.y === currentPos.y) {
        caughtRover = true;
      }
    }

    return { completedpoints: completed, rest: nocaught };
  }, [rover, path]);

  if (!path || path.length < 2) return null;

  return (
    <>
      {completedpoints.length > 1 && (
        <Line
          points={completedpoints}
          color="blue"
          lineWidth={5}
          opacity={0.5}
          transparent
        />
      )}
      {rest.length > 1 && (
        <Line
          points={rest}
          color="white"
          lineWidth={5}
          opacity={0.2}
          transparent
        />
      )}
    </>
  );
};