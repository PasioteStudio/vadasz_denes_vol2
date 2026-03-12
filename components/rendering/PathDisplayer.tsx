import { Line } from "@react-three/drei";
import { useMemo, useEffect, useState } from "react";
import { TILE_GAP } from "./TileRenderer";
import { useTimeline } from "@/lib/contexts";

export const PathDisplayer = () => {
  const { path, rover } = useTimeline();

  const [roverIndex, setRoverIndex] = useState(0);

  const flatPath = useMemo(() => {
    if (!Array.isArray(path)) return [];
    const height = 0.3;

    return path.flatMap(segment =>
      segment.map(
        p => [p.x * TILE_GAP, height, p.y * TILE_GAP] as [number, number, number]
      )
    );
  }, [path]);

  useEffect(() => {
    if (!flatPath.length) return;

    const roverX = rover.position.x * TILE_GAP;
    const roverZ = rover.position.y * TILE_GAP;

    const dist = (p: [number, number, number]) =>
      (p[0] - roverX) ** 2 + (p[2] - roverZ) ** 2;

    setRoverIndex(prev => {
      let best = prev;
      let bestDist = dist(flatPath[prev]);

      const start = Math.max(0, prev - 2);
      const end = Math.min(flatPath.length - 1, prev + 2);

      for (let i = start; i <= end; i++) {
        const d = dist(flatPath[i]);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }

      return best;
    });
  }, [rover.position, flatPath]);

  const completedpoints = flatPath.slice(0, roverIndex + 1);
  const rest = flatPath.slice(roverIndex);

  if (!path || path.length < 2) return null;

  return (
    <>
      {completedpoints.length > 1 && (
        <Line
          points={completedpoints}
          color="orange"
          lineWidth={3}
          opacity={0.8}
          transparent
        />
      )}

      {rest.length > 1 && (
        <Line
          points={rest}
          color="blue"
          lineWidth={3}
          opacity={0.5}
          transparent
        />
      )}
    </>
  );
};