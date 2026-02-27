import { Position } from "@/types/RoverContextTypes";
import { Tile, VectorField, WeightPoint } from "./constants";
import { Field, MapSnapshot } from "@/types/MapTypes";
import { Dispatch, SetStateAction } from "react";

/**
 * Find the nearest ore from a given position using Euclidean distance
 * @param {number} currentX where we are
 * @param {number} currentY where we are
 * @param {WeightPoint[]} oreMap
 * @returns {Position} {x:number, y:number,distance:number}
 */
export function findNearestOre(
  currentX: number,
  currentY: number,
  oreMap: WeightPoint[]
): Position {
  let nearest: Position = { x: currentX, y: currentY }; 
  let minDistance = Infinity;

  oreMap.forEach((ore) => {
    if (ore.weight === 0) return; // Skip already mined ores

    const distance = Math.sqrt(Math.pow(ore.x - currentX,2) + Math.pow(ore.y - currentY,2));

    if (distance < minDistance) {
      minDistance = distance;
      nearest = { x: ore.x, y: ore.y };
    }
  });

  return nearest;
}
export function extractOre(tile_id:number, update_able_map:WeightPoint[],update_able_vector_map:VectorField[][],map:Field[][],snapshotsSetter:Dispatch<SetStateAction<Map<Number, MapSnapshot>>>)
//:VectorField[][]
{
    map[Math.floor(tile_id / update_able_vector_map.length)][tile_id % update_able_vector_map.length].tile = Tile.Empty
    update_able_map[tile_id].weight = 0
    snapshotsSetter(prev=>{
      const previousSnap = prev.get(prev.size - 1)
      prev.set(prev.size,{
        fields: JSON.parse(JSON.stringify(map)),
        rover: {
          currentAction: {
            action: "mine" as ("mine"),
          },
          energy: 100,
          inventory: [],
          logs: [],
          position: map[Math.floor(tile_id / update_able_vector_map.length)][tile_id % update_able_vector_map.length].position,
          startingPosition: previousSnap!.rover.startingPosition,
        }
      })
      return prev
    })
    return 
}
