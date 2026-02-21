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
): NearestOre {
  let nearest: NearestOre = { x: currentX, y: currentY, distance:0 }; 
  let minDistance = Infinity;

  oreMap.forEach((ore) => {
    if (ore.weight === 0) return; // Skip already mined ores

    const distance = Math.sqrt(Math.pow(ore.x - currentX,2) + Math.pow(ore.y - currentY,2));

    if (distance < minDistance) {
      minDistance = distance;
      nearest = { x: ore.x, y: ore.y, distance };
    }
  });

  return nearest;
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
): { dx: number; dy: number } {
  const directStep = {
    dx: toX === fromX ? 0 : toX > fromX ? 1 : -1,
    dy: toY === fromY ? 0 : toY > fromY ? 1 : -1,
  };
  
  const nextX = fromX + directStep.dx;
  const nextY = fromY + directStep.dy;
  
  // Check if direct path is walkable (0 = walkable, 1 = obstacle)
  if (obstacle_map[nextY][nextX] === 0) {
    return directStep;
  }
  
  // Path blocked, use A* to find alternative
  const graphWithWeight = new Graph(obstacle_map.map((rows,idy) => 
    rows.map((tile,idx) => tile === 1 ? (idy == toY && idx == toX ? 1 : 0) : 1)),  //if obstacle = 0 otherwise be 1 and the destination should be 1 aswell
    { diagonal: true });
  const startNode = graphWithWeight.grid[fromY][fromX];
  const endNode = graphWithWeight.grid[toY][toX];
  const path = astar.search(graphWithWeight, startNode, endNode);
  
  // Extract first step from path
  if (path && path.length > 1) {
    const nextNode = path[0];
    return {
      dx: nextNode.y - fromX,
      dy: nextNode.x - fromY,
    };
  }
  return { dx: 0, dy: 0 }; // No path found
}
