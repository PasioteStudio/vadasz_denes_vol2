import { astar } from "@/util/astar"
import { Position } from "@/types/RoverContextTypes";
import { VectorField, WeightPoint } from "./constants"
import { findNearestOre } from "./ore";
import { DefaultCycleContextObject } from "@/lib/contexts";
import { Action } from "./algorithm";

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
 * Kapjuk meg a következő lépést a kijelölt ponthoz rácsos irányokat használva
 * A* algoritmust használ, ha a közvetlen út el van torlaszolva
 * @param {number} fromX ahol tartózkodunk
 * @param {number} fromY 
 * @param {number} toX ahová menni szeretnénk
 * @param {number} toY 
 * @param {boolean} entire visszaadjuk-e az egész utat? (default: false)
 * @returns {{dx:(-1|0|1), dy:(-1|0|1)}} relatív lépés, `{dx:(-1|0|1), dy:(-1|0|1)}` típusban
 */
export function getNextStep(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  obstacleGraph: any,
  entire:boolean = false
): { dx: number; dy: number,entire_path?:Position[] } {
  if(!entire){
    const directStep = {
      dx: toX === fromX ? 0 : toX > fromX ? 1 : -1,
      dy: toY === fromY ? 0 : toY > fromY ? 1 : -1,
    };

    const nextX = fromX + directStep.dx;
    const nextY = fromY + directStep.dy;

    // Nézzük meg, hogy a közvetlen út járható e (1 = járható, 0 = akadály)
    if (obstacleGraph.grid[nextY][nextX].weight === 1) return directStep;
  }

  // Az út el van torlaszolva, használjuk az A* algoritmust egy alternatív út kereséséhez
  const startNode = obstacleGraph.grid[fromY][fromX];
  const endNode = obstacleGraph.grid[toY][toX];
  endNode.weight = 1
  const path = astar.search(obstacleGraph, startNode, endNode);

  if (path && path.length > 0) {
    const nextNode = path[0];
    return {
      dx: nextNode.y - fromX,
      dy: nextNode.x - fromY,
      entire_path : entire ? path.map(i=>{return {x:i.y,y:i.x}}) : undefined
    };
  }
  return { dx: 0, dy: 0 }; // Nincs út oda
}
/**
 * Be leszünk-e ragadva?
 * @param {VectorField} next_column a következő mező
 * @param {Action[]} my_path az eddig megtett útt
 * 
 * @returns {boolean} `boolean`
 */
export function isStuck(
  next_column: VectorField,
  my_path: Action[],
): boolean {
  return my_path.slice(-2).filter(tile => 
      (tile.position.x == next_column.x && tile.position.y == next_column.y) || 
      (next_column.x + next_column.endPoint.relative_x == tile.position.x && tile.position.y == next_column.y + next_column.endPoint.relative_y)
  ).length > 0
}


/**
 * Funkció, ha be vagyunk ragadva
 * @param {Position} column ahol tartózkodunk
 * @param {WeightPoint[]} update_able_map a térkép ércekkel
 * @param {Graph} [obstacleGraph] a 2d-s gráf az akadályokból
 * 
 * @returns {Position} `next_column_to_go` a következő mező, `Position` típusban
 */
export function stuck(
  column: Position,
  update_able_map: WeightPoint[],
  obstacleGraph:any
): { next_column_to_go: Position } {
  const nearestOre = findNearestOre(column.x, column.y, update_able_map)
  const step = getNextStep(column.x, column.y, nearestOre.x, nearestOre.y,obstacleGraph)
  return { next_column_to_go: { x: column.x + step.dx, y: column.y + step.dy } }
}

/**
 * Visszaad egy logikai értéket
 * @param {VectorField} column ahol tartózkodunk
 * 
 * @returns {boolean} `boolean` mutat-e valahova a vektor?
 */
export function isThereAWay(column: VectorField) {
  return column.endPoint.relative_x != 0 || column.endPoint.relative_y != 0
}

/**
 * Visszaadja ugyanazt a struktúrát, de lemásolva
 * Így megakadályozza, hogy az eredeti változót felülírva
 * ezt is felülírják. (Allokál még egy memória helyet)
 * @param {T} array a változó, amit másolunk
 * 
 * @returns {T} egy másik változó, ugyanazzal az értékekkel, de másik memória helyen
 */
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