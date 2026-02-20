import {Graph,astar} from "@/util/astar"

interface OrePoint {
  x: number;
  y: number;
  weight: number;
}

interface NearestOre {
  x: number;
  y: number;
  distance: number;
}

/**
 * Find the nearest ore from a given position using Euclidean distance
 */
export function findNearestOre(
  currentX: number,
  currentY: number,
  oreMap: OrePoint[]
): NearestOre | null {
  if (oreMap.length === 0) return null;

  let nearest: NearestOre | null = null;
  let minDistance = Infinity;

  oreMap.forEach((ore) => {
    if (ore.weight === 0) return; // Skip already mined ores
    
    const dx = ore.x - currentX;
    const dy = ore.y - currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = { x: ore.x, y: ore.y, distance };
    }
  });

  return nearest;
}

/**
 * Find K nearest ores from a given position (useful for alternatives)
 */
export function findKNearestOres(
  currentX: number,
  currentY: number,
  oreMap: OrePoint[],
  k: number = 5
): NearestOre[] {
  if (oreMap.length === 0) return [];

  const distances: NearestOre[] = oreMap
    .filter((ore) => ore.weight > 0) // Only unmined ores
    .map((ore) => {
      const dx = ore.x - currentX;
      const dy = ore.y - currentY;
      return {
        x: ore.x,
        y: ore.y,
        distance: Math.sqrt(dx * dx + dy * dy),
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k);

  return distances;
}

/**
 * Get next step toward a target position using grid directions
 * Considers obstacles and uses A* if direct path is blocked
 * Returns { dx, dy } where each is -1, 0, or 1
 */
export function getNextStep(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  obstacle_map: (0|1)[][],
  map: string[][]
): { dx: number; dy: number } {
  const directStep = {
    dx: toX === fromX ? 0 : toX > fromX ? 1 : -1,
    dy: toY === fromY ? 0 : toY > fromY ? 1 : -1,
  };
  
  const nextX = fromX + directStep.dx;
  const nextY = fromY + directStep.dy;
  
  // Check bounds
  if (nextX < 0 || nextX >= obstacle_map[0].length || 
      nextY < 0 || nextY >= obstacle_map.length) {
    return { dx: 0, dy: 0 };
  }
  
  // Check if direct path is walkable (1 = walkable, 0 = obstacle)
  if (obstacle_map[nextY][nextX] === 1) {
    return directStep;
  }
  
  // Path blocked, use A* to find alternative
  const graphWithWeight = new Graph(map.map(rows => {
    return rows.map(tile => tile === "#" ? 0 : 1);
  }), { diagonal: true });
  
  const startNode = graphWithWeight.grid[fromY][fromX];
  const endNode = graphWithWeight.grid[toY][toX];
  const path = astar.search(graphWithWeight, startNode, endNode);
  
  // Extract first step from path
  if (path && path.length > 1) {
    const nextNode = path[1];
    return {
      dx: nextNode.x - fromX,
      dy: nextNode.y - fromY,
    };
  }
  
  return { dx: 0, dy: 0 }; // No path found
}
