import {Graph,astar} from "@/util/astar"
import { Position } from "@/types/RoverContextTypes";
import { createVectorMapFromWeights } from "./map";
import {VectorField,WeightPoint} from "./constants"
import { findNearestOre } from "./ore";
import { useSnapshots } from "@/lib/contexts";
import { Field, MapSnapshot } from "@/types/MapTypes";
import { Dispatch, SetStateAction } from "react";

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

/**
 * Are we gonna be stuck?
 * @param {Position} column where we are
 * @param {WeightPoint[]} update_able_map
 * @param {(0|1)[][]} [obstacle_map]
 * 
 * @returns {Position} next_column_to_go
 */
export function stuck(
    column:Position,
    update_able_map:WeightPoint[],
    obstacle_map:(0|1)[][]
):{next_column_to_go:Position}{
    const nearestOre = findNearestOre(column.x, column.y, update_able_map)
    const step = getNextStep(column.x, column.y, nearestOre.x, nearestOre.y,obstacle_map)
    return {next_column_to_go:{x:column.x + step.dx,y:column.y + step.dy}}
}

/**
 * Returns a bool
 * @param {VectorField} column where we are
 * 
 * @returns {boolean} does the vector points to somewhere?
 */
export function isThereAWay(column:VectorField){
    return column.endPoint.relative_x != 0 || column.endPoint.relative_y != 0
}

export function TookAnotherStep(map:Field[][], turnback_value:number,obstacle_map:(0|1)[][],start:Position,path:Position[],point:Position, update_able_map:WeightPoint[],update_able_vector_map:VectorField[][],snapshotsSetter:Dispatch<SetStateAction<Map<Number, MapSnapshot>>>)
:{vector_map:VectorField[][],go_back:boolean}
{
    
    const graphWithWeight = new Graph(obstacle_map.map((rows,idy) => 
        rows.map((tile,idx) => tile === 1 ? 0 : 1)),  //if obstacle = 0 otherwise be 1 and the destination should be 1 aswell (start is always 1)
        { diagonal: true });
    const startNode = graphWithWeight.grid[point.y][point.x];
    const endNode = graphWithWeight.grid[start.y][start.x];
    const astarpath = astar.search(graphWithWeight, startNode, endNode);

    const vector_map = createVectorMapFromWeights(update_able_vector_map.length,update_able_vector_map[0].length,point,update_able_map)
    
    //go back even if there's no ore left
    const last_element = update_able_vector_map[path[path.length - 1].y][path[path.length - 1].x]
    const next_column = update_able_vector_map[last_element.y][last_element.x]
    
    snapshotsSetter(prev=>{
      const previousSnap = prev.get(prev.size - 1)
      prev.set(path.length,{
        fields: JSON.parse(JSON.stringify(map)), //TODO 2 differen map perhaps
        rover: {
          currentAction: {
            action: "move" as ("move"),
          },
          energy: 100,
          inventory: [],
          logs: [],
          position: point,
          startingPosition: previousSnap!.rover.startingPosition,
        }
      })
      return prev
    })
    return {vector_map,go_back:((path.length + astarpath.length) >= turnback_value || !isThereAWay(next_column) )}
}