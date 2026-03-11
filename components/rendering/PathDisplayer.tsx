import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { TILE_GAP } from "./TileRenderer";
import { useTimeline } from "@/lib/contexts";

export const PathDisplayer = () => {
  const { path, rover } = useTimeline();
  
  // Track the current flat index of the rover along the path
  const roverIndexRef = useRef(0);

  const { completedpoints, rest } = useMemo(() => {
    if (!Array.isArray(path)) return { completedpoints: [], rest: [] };

    const flatPath: [number, number, number][] = [];
    const height = 0.3;

    // Flatten the path
    path.forEach(segment => {
      segment.forEach(p => {
        flatPath.push([p.x * TILE_GAP, height, p.y * TILE_GAP]);
      });
    });

    // Find the next index where the rover is
    let nextIndex = roverIndexRef.current;
    for (let i = roverIndexRef.current; i < flatPath.length; i++) {
      const pt = flatPath[i];
      if (pt[0] === rover.position.x * TILE_GAP && pt[2] === rover.position.y * TILE_GAP) {
        nextIndex = i;
        break;
      }
    }

    // Only advance by one index per render
    if (nextIndex > roverIndexRef.current) {
      roverIndexRef.current += 1;
    }

    const completedpoints = flatPath.slice(0, roverIndexRef.current + 1);
    const rest = flatPath.slice(roverIndexRef.current); // include current rover point

    return { completedpoints, rest };
  }, [path, rover]);

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