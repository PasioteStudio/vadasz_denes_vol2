import { Position } from "@/types/RoverContextTypes";
import { WeightPoint } from "./constants";

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
): {x:number,y:number,distance:number} {
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

  return {...nearest,distance:minDistance};
}