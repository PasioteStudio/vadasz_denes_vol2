import { Tile, WeightPoint, VectorField } from "./constants";
import { Position } from "@/types/RoverContextTypes";
import { calculateTile, isInDistance, toTile } from "./tile";
import { Field } from "@/types/MapTypes";

//TESTING ONLY
export function generateMap(): Field[][] {
  const mapConstraints = {
    height: 50,
    width: 50
  }
  const mapArray: Field[][] = [];
  let startingPointSet = false
  for (let i = 0; i < mapConstraints.height; i++) {
    const row: Field[] = [];
    for (let j = 0; j < mapConstraints.width; j++) {
      const rand = Math.random();

      const rand2 = Math.random();
      if ((rand2 < 0.0005 && !startingPointSet) || (i == mapConstraints.height - 1 && j == mapConstraints.width - 1 && !startingPointSet)) {
        startingPointSet = true
        row.push({
          tile: Tile.Start,
          position: {x:j , y:i }
        }); // Rover starting point
      } else if (rand < 0.70) {
        row.push({
          tile: Tile.Empty,
          position: {x:j , y:i }
        }); // Passable terrain
      } else if (rand < 0.85) {
        row.push({
          tile: Tile.Obstacle,
          position: {x:j , y:i }  
        }); // Obstacles
      } else if (rand < 0.90) {
        row.push({
          tile: Tile.Blue,
          position: {x:j , y:i }  
        }); // Blue mineral
      } else if (rand < 0.95) {
        row.push({
          tile: Tile.Yellow,
          position: {x:j , y:i }  
        }); // Yellow mineral
      } else {
        row.push({
          tile: Tile.Green,
          position: {x:j , y:i }
        }); // Green mineral
      }
    }
    mapArray.push(row);
  }
  return mapArray;
}
//TESTING ONLY

/**
 * Creates a map from a file using an URL
 * @param {string} URL the path to the file
 * @returns {Promise<Tile[][]>} map (Promise<Tile[][]>)
 */
export async function readMap(URL: string, isText = false): Promise<Field[][]> {
  let lines: string[] = [];
  if (!isText) {
    await fetch(URL).then(res => res.text()).then(async (data) => {
      lines = data.split("\n").filter(line => line.trim() != "");
    })
  } else{
    lines = URL.split("\n").filter(line => line.trim() != "");
  }
  const map: Field[][] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() == "") continue;
    map.push([]);
    const currentRow = map[map.length - 1];
    const fields = lines[i].trim().split(',').map((s, _i): Field => {
      return {
        position: { x: _i, y: i },
        tile: toTile(s),
      }
    })
    fields.forEach(f => currentRow.push(f));

  }
  return map;
}

/**
 * Creates a vector map from weights
 * @param {number} width
 * @param {number} height
 * @param {Position} point where we are
 * @param {WeightPoint[]} weightPoints
 * @param {number} distance from which the tiles should be calculated. 0 means that only the standing one and the one that it points to
 * @returns {VectorField[][]} vector map (VectorField[][])
 */
export function createVectorMapFromWeights(
  width: number,
  height: number,
  point: Position,
  weightPoints: WeightPoint[],
  distance?: number,
): VectorField[][] {
  const vectorMap: VectorField[][] = Array(height)
    .fill(null)
    .map(() => Array(width));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isInDistance({ y: y, x: x }, point, distance ? distance : 1)) {
        vectorMap[y][x] = {
          x,
          y,
          //vector: { dx: 0, dy: 0 },
          magnitude: 0,
          endPoint: {
            relative_x: 0,
            relative_y: 0,
          },
          angleDeg360: 0,
        };
        continue
      }
      vectorMap[y][x] = calculateTile(weightPoints, x, y)
    }
  }
  return vectorMap;
}

export const isValidMap = (map: Field[][]): boolean => {
  return map.length > 0 && map.find(row => row.find(field => field.tile == Tile.Start)) != undefined;
}