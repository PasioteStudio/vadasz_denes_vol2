import { Position } from "@/types/RoverContextTypes";
import { WeightPoint } from "../lib/constants";
import { getLastPosition } from "./tile";
import { Action } from "./algorithm";

/**
 * Megtalálja a legközelebbi ércet az adott pontból euklideszi távolságot használva
 * @param {number} currentX ahol tartózkodunk
 * @param {number} currentY
 * @param {WeightPoint[]} oreMap a térkép ércekkel
 * @returns {{x:number,y:number,distance:number}} a legközelebbi érc koordinátái és távolsága, `{x:number, y:number,distance:number}` típusban
 */
export function findNearestOre(
  currentX: number,
  currentY: number,
  oreMap: WeightPoint[]
): {x:number,y:number,distance:number} {
  let nearest: Position = { x: currentX, y: currentY }; 
  let minDistance = Infinity;
  oreMap.forEach((ore) => {
    if (ore.weight === 0) return; // Lépjük át az üres mezőket
    const distance = Math.sqrt(Math.pow(ore.x - currentX,2) + Math.pow(ore.y - currentY,2));
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { x: ore.x, y: ore.y };
    }
  });
  return {...nearest,distance:(minDistance === Infinity ? 0 : minDistance)};
}

export const getNearestOreDistance = (final_path:Action[],update_able_map:WeightPoint[]) => {
  return Math.ceil(findNearestOre(getLastPosition(final_path).x, getLastPosition(final_path).y, update_able_map).distance)
}