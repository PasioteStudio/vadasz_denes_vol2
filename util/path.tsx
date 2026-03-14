import { astar } from "@/lib/astar"
import { Position } from "@/types/RoverContextTypes";
import { energy_moving, VectorField, WeightPoint } from "../lib/constants"
import { findNearestOre, getNearestOreDistance } from "./ore";
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
  const weight = endNode.weight
  endNode.weight = 1
  const path = astar.search(obstacleGraph, startNode, endNode);
  endNode.weight = weight

  if (path && path.length > 0) {
    const nextNode = path[0];
    return {
      dx: nextNode.y - fromX,
      dy: nextNode.x - fromY,
      entire_path : entire ? path : undefined //WARNING: ez az út x és y koordinátája fel van cserélve!
    };
  }
  return { dx: 0, dy: 0, entire_path:entire ? [] : undefined}; // Nincs út oda
}
/**
 * Be leszünk-e ragadva?
 * @param {VectorField} next_tile a következő mező
 * @param {Action[]} my_path az eddig megtett útt
 * 
 * @returns {boolean} `boolean`
 */
export function isStuck(
  next_tile: VectorField,
  my_path: Action[],
): boolean {
  return my_path.slice(-2).filter(tile => 
      (tile.positions[tile.positions.length - 1].x == next_tile.x && tile.positions[tile.positions.length - 1].y == next_tile.y) || 
      (next_tile.x + next_tile.endPoint.relative_x == tile.positions[tile.positions.length - 1].x && tile.positions[tile.positions.length - 1].y == next_tile.y + next_tile.endPoint.relative_y)
  ).length > 0
}


/**
 * Funkció, ha be vagyunk ragadva
 * @param {Position} current_tile ahol tartózkodunk
 * @param {WeightPoint[]} update_able_map a térkép ércekkel
 * @param {Graph} [obstacleGraph] a 2d-s gráf az akadályokból
 * 
 * @returns {Position} `next_tile_to_go` a következő mező, `Position` típusban
 */
export function stuck(
  current_tile: Position,
  update_able_map: WeightPoint[],
  obstacleGraph:any
): { next_tile_to_go: Position } {
  const nearestOre = findNearestOre(current_tile.x, current_tile.y, update_able_map)
  const step = getNextStep(current_tile.x, current_tile.y, nearestOre.x, nearestOre.y,obstacleGraph)
  return { next_tile_to_go: { x: current_tile.x + step.dx, y: current_tile.y + step.dy } }
}

/**
 * Visszaad egy logikai értéket
 * @param {VectorField} current_tile ahol tartózkodunk
 * 
 * @returns {boolean} `boolean` mutat-e valahova a vektor?
 */
export function isThereAWay(current_tile: VectorField) {
  return current_tile.endPoint.relative_x != 0 || current_tile.endPoint.relative_y != 0
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
/**
 * @description Megnézi, hogy nagyobb-e a jelenlegi energia, mint a következőleg megtenni kívánt út
 * 
 * @param {number} power jelenlegi energia
 * @param {number} time jelenlegi idő (út hossza)
 * @param {number} current a jelenlegi félórában megtett út mennyisége
 * @param {number | null} next_tile_id a következő mező érc értéke (ha van)
 * 
 * @returns {boolean} van-e
 */
export function isThereEnoughPower(power:number,time:number,current:number,next_tile_id:number | null):boolean{
    return power >= energy_moving(current) - (isDay(time) ? 10 : 0) + (next_tile_id !== null ? 2 : 0)
}

export function modified_astarpath(power:number,time:number,path:Position[],current_pos:Position){
    let current_power = power
    const modified_path:Action[] = []
    //menjen a rover az út végéig
    let j = 0
    while(j < path.length ){
        if(!isThereEnoughPower(current_power,time + modified_path.length,1,null)){
            let prev = modified_path.length == 0 ? [current_pos] : modified_path[modified_path.length - 1].positions
            modified_path.push({action:"wait",positions:[prev[prev.length - 1]]})
            if(current_power>0)current_power-=1
            current_power+=(isDay(time + modified_path.length) ? 10 : 0)
            if(current_power > 100)current_power = 100
            continue
        }
        const positions:Position[] = []
        while(positions.length < 3 && j<path.length && isThereEnoughPower(current_power,time +modified_path.length,positions.length + 1,null)){
            positions.push({x:path[j].y,y:path[j].x})
            j++
        }
        modified_path.push({action:"move",positions:positions})
        current_power -= energy_moving(positions.length)
        if(current_power < 0)current_power = 0
        current_power += isDay(time + modified_path.length) ? 10 : 0
        if(current_power > 100)current_power = 100
    }
    return {power:current_power, modified_path}
}


export const getHasTimeToReturn = (final_path:Action[],go_home:Action[],iterations:number,update_able_map:WeightPoint[])=> {
  return final_path.length + (final_path.length < 1 ? 0 : getNearestOreDistance(final_path,update_able_map)) + go_home.length < iterations
}