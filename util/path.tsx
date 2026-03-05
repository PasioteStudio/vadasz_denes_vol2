import { Graph, astar } from "@/util/astar"
import { Position } from "@/types/RoverContextTypes";
import { Tile, VectorField, WeightPoint } from "./constants"
import { findNearestOre } from "./ore";
import { Dispatch, SetStateAction } from "react";
import { DefaultCycleContextObject } from "@/lib/contexts";
import { calculateTile } from "./tile";
import { Delta } from "@/types/MapTimelineContextTypes";

// Precompute octant-to-step map once (not per iteration)
export const octantToStep: { [k: number]: { dx: number; dy: number } } = {
  0: { dx: 1, dy: 0 },
  1: { dx: 1, dy: -1 },
  2: { dx: 0, dy: -1 },
  3: { dx: -1, dy: -1 },
  4: { dx: -1, dy: 0 },
  5: { dx: -1, dy: 1 },
  6: { dx: 0, dy: 1 },
  7: { dx: 1, dy: 1 },
};

/**
 * Get next step toward a target position using grid directions
 * Considers obstacles and uses A* if direct path is blocked
 * @param {number} fromX where we are
 * @param {number} fromY where we are
 * @param {number} toX where we want to go
 * @param {number} toY where we want to go
 * @param {(0|1)[][]} obstacle_map
 * @returns {{dx:(-1|0|1), dy:(-1|0|1)}} {dx:(-1|0|1), dy:(-1|0|1)}
 */
export function getNextStep(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  obstacle_map: (0 | 1)[][],
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
  const graphWithWeight = new Graph(obstacle_map.map((rows, idy) =>
    rows.map((tile, idx) => tile === 1 ? (idy == toY && idx == toX ? 1 : 0) : 1)),  //if obstacle = 0 otherwise be 1 and the destination should be 1 aswell
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

/**
 * Are we gonna be stuck?
 * @param {Position} column where we are
 * @param {WeightPoint[]} update_able_map
 * @param {(0|1)[][]} [obstacle_map]
 * 
 * @returns {Position} next_column_to_go
 */
export function stuck(
  column: Position,
  update_able_map: WeightPoint[],
  obstacle_map: (0 | 1)[][]
): { next_column_to_go: Position } {
  const nearestOre = findNearestOre(column.x, column.y, update_able_map)
  const step = getNextStep(column.x, column.y, nearestOre.x, nearestOre.y, obstacle_map)
  return { next_column_to_go: { x: column.x + step.dx, y: column.y + step.dy } }
}

/**
 * Returns a bool
 * @param {VectorField} column where we are
 * 
 * @returns {boolean} does the vector points to somewhere?
 */
export function isThereAWay(column: VectorField) {
  return column.endPoint.relative_x != 0 || column.endPoint.relative_y != 0
}

export function deepCopy<T>(array: T[]): T[] {
  return array.map(item =>
    typeof item === 'object' && item !== null && !Array.isArray(item)
      ? { ...item }
      : Array.isArray(item)
        ? deepCopy(item as unknown as T[])
        : item
  ) as T[];
}

export function isDay(tick: number): boolean {
  return tick % 48 <= DefaultCycleContextObject.day
}

export function TookAnotherStep(map: Tile[][], turnback_value: number, obstacle_map: (0 | 1)[][], start: Position, path: Position[], point: Position, update_able_map: WeightPoint[], snapshotsSetter: Dispatch<SetStateAction<Delta[]>>, tile_id: number | null)
  : { map: Tile[][], go_back: boolean } {
  //path.length == current_tick (half hour)
  path.push(point)
  snapshotsSetter(prev => {
    const previousSnap = prev.get(prev.size - 1)
    prev.set(path.length, {
      ...previousSnap,
      fields: map,
      rover: {
        ...previousSnap!.rover,
        currentAction: {
          action: "move" as ("move"),
        },
        energy: Math.min(previousSnap!.rover.energy - 2 + (isDay(path.length) ? 10 : 0), 100), //TODO calc power usage
        position: point,
        startingPosition: previousSnap!.rover.startingPosition,
        logs: [
          ...previousSnap!.rover.logs,
          {
            message: `Mozgás ide: {TODO}`,
          }
        ],
      }
    })
    return prev
  })
  if (tile_id !== null) {
    map = deepCopy(map)
    path.push(point)

    map[Math.floor(tile_id / map.length)][tile_id % map[0].length] = Tile.Empty
    update_able_map[tile_id].weight = 0

    snapshotsSetter(prev => {
      const previousSnap = prev.get(prev.size - 1)!
      const prevInventory = previousSnap.rover.inventory ?? []

      let found = false
      const newInventory = prevInventory.map(item => {
        if (item.ore === Tile.Yellow) {
          found = true
          return { ...item, amount: item.amount + 1 }
        }
        return item
      })

      if (!found) {
        newInventory.push({ ore: Tile.Yellow, amount: 1 })
      }

      prev.set(path.length, {
        ...previousSnap,
        fields: map,
        rover: {
          ...previousSnap.rover,
          currentAction: {
            action: "mine" as "mine",
          },
          energy: Math.min(previousSnap.rover.energy - 2 + (isDay(path.length) ? 10 : 0), 100),
          inventory: newInventory,
          logs: [
            ...previousSnap.rover.logs,
            {
              message: "Bányászás: {TODO} érc",
            }
          ],
          position: map[Math.floor(tile_id / map.length)][tile_id % map[0].length].position,
        }
      })

      return prev
    })
  }

  const graphWithWeight = new Graph(obstacle_map.map((rows, idy) =>
    rows.map((tile, idx) => tile === 1 ? 0 : 1)),  //if obstacle = 0 otherwise be 1 and the destination should be 1 aswell (start is always 1)
    { diagonal: true });
  const startNode = graphWithWeight.grid[point.y][point.x];
  const endNode = graphWithWeight.grid[start.y][start.x];
  const astarpath = astar.search(graphWithWeight, startNode, endNode);

  //go back even if there's no ore left
  const current_column = calculateTile(update_able_map, point.x, point.y)

  //const tile_id_temp = update_able_map.findIndex(tile=>tile.y == current_column.y + current_column.endPoint.relative_y && tile.x == current_column.x + current_column.endPoint.relative_x)
  //const isThereAnOre = update_able_map[tile_id_temp].weight != 0

  return { map, go_back: ((path.length + astarpath.length) >= turnback_value - 1 || !isThereAWay(current_column)) }
}