import { Graph, astar } from "@/util/astar"
import { Position } from "@/types/RoverContextTypes";
import { Tile, VectorField, WeightPoint } from "./constants"
import { findNearestOre } from "./ore";
import { DefaultCycleContextObject } from "@/lib/contexts";
import { calculateTile } from "./tile";
import { Delta } from "@/types/MapTimelineContextTypes";
import { processPositionChanges } from "./deltas";

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

  if (obstacle_map[nextY][nextX] === 0) {
    return directStep;
  }

  const graphWithWeight = new Graph(obstacle_map.map((rows, idy) =>
    rows.map((tile, idx) => tile === 1 ? (idy == toY && idx == toX ? 1 : 0) : 1)),
    { diagonal: true });
  const startNode = graphWithWeight.grid[fromY][fromX];
  const endNode = graphWithWeight.grid[toY][toX];
  const path = astar.search(graphWithWeight, startNode, endNode);

  if (path && path.length > 1) {
    const nextNode = path[0];
    return {
      dx: nextNode.y - fromX,
      dy: nextNode.x - fromY,
    };
  }
  return { dx: 0, dy: 0 };
}

export function stuck(
  column: Position,
  update_able_map: WeightPoint[],
  obstacle_map: (0 | 1)[][]
): { next_column_to_go: Position } {
  const nearestOre = findNearestOre(column.x, column.y, update_able_map)
  const step = getNextStep(column.x, column.y, nearestOre.x, nearestOre.y, obstacle_map)
  return { next_column_to_go: { x: column.x + step.dx, y: column.y + step.dy } }
}

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

export function TookAnotherStep(
  map: Tile[][],
  turnback_value: number,
  obstacle_map: (0 | 1)[][],
  start: Position,
  path: Position[],
  point: Position,
  update_able_map: WeightPoint[],
  deltas: Delta[],   // <-- plain array now, not a setter
  tile_id: number | null
): { map: Tile[][], go_back: boolean } {
  path.push(point)

    deltas.push({
        energy: -1 + (isDay(path.length) ? 10 : 0),
        inventoryChanges: [],
        logsAdded: [{ message: "Mozgás ide: TODO" }],
        moves: [{
            mode: "move",
            from: path.length >= 2 ? path[path.length - 2] : point,
            to: point,
        }]
    })

    if (tile_id !== null) {
        const tileY = Math.floor(tile_id / map[0].length);
        const tileX = tile_id % map[0].length;
        const oreType = map[tileY][tileX]; // read BEFORE clearing

        map = deepCopy(map)
        map[tileY][tileX] = Tile.Empty
        update_able_map[tile_id].weight = 0

        // mine is a separate delta — rover stays on same tile
        path.push(point)
        deltas.push({
            energy: -2 + (isDay(path.length) ? 10 : 0),
            inventoryChanges: [{
                amount: 1,
                mode: "add",
                ore: oreType as Tile.Yellow | Tile.Green | Tile.Blue
            }],
            logsAdded: [{ message: "Bányászás: {TODO} érc" }],
            moves: [{
                mode: "mine",
                from: point,
                to: point,
                ore: oreType,
            }]
        })
    }

  const graphWithWeight = new Graph(obstacle_map.map((rows) =>
    rows.map((tile) => tile === 1 ? 0 : 1)),
    { diagonal: true });
  const startNode = graphWithWeight.grid[point.y][point.x];
  const endNode = graphWithWeight.grid[start.y][start.x];
  const astarpath = astar.search(graphWithWeight, startNode, endNode);

  const current_column = calculateTile(update_able_map, point.x, point.y)

  return { map, go_back: ((path.length + astarpath.length) >= turnback_value - 1 || !isThereAWay(current_column)) }
}