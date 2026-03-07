import { Position } from "@/types/RoverContextTypes";
import { Tile, VectorField } from "./constants";
import { octantToStep } from "./path";
import { WeightPoint } from "./constants";

/**
 * Converts a string to an enum
 * @param {string} char the tile
 * @returns {Tile} the converted tile (Tile)
 */
export const toTile = (char: string): Tile => {
    switch(char){
        case "B": return Tile.Blue;
        case "Y": return Tile.Yellow;
        case "G": return Tile.Green;
        case "#": return Tile.Obstacle;
        case "S": return Tile.Start;
        default: return Tile.Empty;
    }
}

export const tileToString = (tile: Tile):string => {
  switch(tile){
        case Tile.Blue: return "Kék Ásvány" ;
        case Tile.Yellow: return "Sárga Ásvány" ;
        case Tile.Green: return "Zöld Ásvány" ;
        case Tile.Obstacle: return "Akadály" ;
        case Tile.Start: return "Kezdő Mező" ;
        default: return "Üres";
    }
}

/**
 * Returns true if the points are in distance of each other otherwise returns false
 * @param {Position} point1
 * @param {Position} point2
 * @param {number} distance
 * @returns {boolean} boolean
 */
export function isInDistance(point1:Position,point2:Position,distance:number):boolean{
  return Math.abs(point1.x - point2.x) <= distance && Math.abs(point1.y - point2.y) <= distance
}

/**
 * Returns the VectorField of the point
 * @param {WeightPoint[]} weightPoints
 * @param {number} x
 * @param {number} y
 * @returns {VectorField} VectorField
 */
export function calculateTile(weightPoints:WeightPoint[],x:number,y:number) : VectorField{
  let totalInfluence = 0;
  let weightedPosX = 0;
  let weightedPosY = 0;
  let totalDx = 0;
  let totalDy = 0;

  // Calculate influence from each weight point and accumulate a weighted center
  weightPoints.forEach((point) => {
    //skip non ores
    if(point.weight == 0) return

    const dx = point.x - x;
    const dy = point.y - y;
    const distance = Math.hypot(dx, dy);
    const safeDist = Math.max(distance, 1e-6); // avoid division by zero, but not bias small distances too much
    const influence = point.weight / (safeDist * safeDist); // inverse square law

    weightedPosX += point.x * influence;
    weightedPosY += point.y * influence;
    totalDx += (dx / safeDist) * influence;
    totalDy += (dy / safeDist) * influence;
    totalInfluence += influence;
  });

  const inv = totalInfluence === 0 ? 0 : 1 / totalInfluence;

  //const centerX = totalInfluence === 0 ? x : weightedPosX / totalInfluence;
  //const centerY = totalInfluence === 0 ? y : weightedPosY / totalInfluence;

  const vx = totalDx * inv;
  const vy = totalDy * inv;
  const magnitudeFinal = Math.hypot(vx, vy);

  // angles: invert vy for screen coords where +y is downward so 0deg = right, 90deg = up
  const angleDeg360 = magnitudeFinal === 0 ? 0 : ((Math.atan2(-vy, vx) * 180) / Math.PI + 360) % 360; // 0..360

  // Map angle into 8-direction octants for discrete tile stepping
  const rel = magnitudeFinal === 0 ? { dx: 0, dy: 0 } : octantToStep[Math.floor((angleDeg360 + 22.5) / 45) % 8];

  return {
    x,
    y,
    //vector: { dx: vx, dy: vy },
    magnitude: magnitudeFinal,
    endPoint: {
      relative_x: rel.dx,
      relative_y: rel.dy,
    },
    angleDeg360,
  };
}