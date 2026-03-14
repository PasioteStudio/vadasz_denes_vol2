import { Position } from "@/types/RoverContextTypes";
import { Tile, VectorField } from "../lib/constants";
import { octantToStep } from "./path";
import { WeightPoint } from "../lib/constants";
import { Action } from "./algorithm";

/**
 * Átalakítja a `string` karakterláncot `enum` felsorolássá
 * @param {string} char a mező karakter értéke
 * @returns {Tile} `Tile` az átalakított mező
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

/**
 * Visszaalakítja a `enum` felsorolást `string` karakterlánccá 
 * @param {Tile} tile a mező felsorolás értéke
 * @returns {string} `string` az átalakított mező
 */
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
 * Igazat ad vissza, ha a pontok egy megadott távolságon belül vannak egymásnak, hamisat ha nincsenek
 * @param {Position} point1 egyik pont
 * @param {Position} point2 másik pont
 * @param {number} distance a megadott távolság
 * @returns {boolean} `boolean` logikai érték
 */
export function isInDistance(point1:Position,point2:Position,distance:number):boolean{
  return Math.abs(point1.x - point2.x) <= distance && Math.abs(point1.y - point2.y) <= distance
}

/**
 * Visszaadja a `VectorField` értéket a megadott pontnak
 * @param {WeightPoint[]} weightPoints
 * @param {number} x
 * @param {number} y
 * @returns {VectorField} `VectorField`
 */
export function calculateTile(weightPoints:WeightPoint[],x:number,y:number) : VectorField{
  let totalInfluence = 0;
  let weightedPosX = 0;
  let weightedPosY = 0;
  let totalDx = 0;
  let totalDy = 0;

  // Számoljuk ki a befolyását az egyes pontoknak
  weightPoints.forEach((point) => {
    //Lépjük át a nem érceket
    if(point.weight == 0) return

    const dx = point.x - x;
    const dy = point.y - y;
    const distance = Math.hypot(dx, dy);
    const safeDist = Math.max(distance, 1e-6); // ne osszunk 0-val, de ne is adjuk nagy befolyást a túl közeli súlyoknak
    const influence = point.weight / (safeDist * safeDist);

    weightedPosX += point.x * influence;
    weightedPosY += point.y * influence;
    totalDx += (dx / safeDist) * influence;
    totalDy += (dy / safeDist) * influence;
    totalInfluence += influence;
  });

  const inv = totalInfluence === 0 ? 0 : 1 / totalInfluence;

  const vx = totalDx * inv;
  const vy = totalDy * inv;
  const magnitudeFinal = Math.hypot(vx, vy);

  // szögek: fordítsuk meg a `vy` változót, hogy megkapjuk melyik index fele mutat.
  // Ahol +y lefel mutat, így 0 deg = jobbra, 90 deg = felfele mutat
  const angleDeg360 = magnitudeFinal === 0 ? 0 : ((Math.atan2(-vy, vx) * 180) / Math.PI + 360) % 360; // 0..360

  // A szög átalakítva egy 8 lehetséges irányú lépésre
  const rel = magnitudeFinal === 0 ? { dx: 0, dy: 0 } : octantToStep[Math.floor((angleDeg360 + 22.5) / 45) % 8];

  return {
    x,
    y,
    endPoint: {
      relative_x: rel.dx,
      relative_y: rel.dy,
    }
  };
}

export function getlast<T>(arr:T[]): T {
  return arr[arr.length-1]
}
export const getLastPosition = (arr: Action[]) => {
    const last = getlast(arr)
    return getlast(last.positions)
}