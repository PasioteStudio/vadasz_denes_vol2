import { Tile } from "../lib/constants";
import { Position } from "@/types/RoverContextTypes";
import { toTile } from "./tile";

/**
 * Véletlenszerű térképet generál.
 * @returns {Tile[][]} map `Tile[][]`
 */
export function generateMap(): Tile[][] {
  const mapConstraints = {
    height: 50,
    width: 50
  }
  const mapArray: Tile[][] = [];
  let startingPointSet = false;
  for (let i = 0; i < mapConstraints.height; i++) {
    const row: Tile[] = [];
    for (let j = 0; j < mapConstraints.width; j++) {
      const rand = Math.random();

      const rand2 = Math.random();
      if ((rand2 < 0.0005 && !startingPointSet) || (i == mapConstraints.height - 1 && j == mapConstraints.width - 1 && !startingPointSet)) {
        startingPointSet = true;
        row.push(Tile.Start); // Kezdőpont
      } else if (rand < 0.70) {
        row.push(Tile.Empty); // Mozgást nem gátló mező
      } else if (rand < 0.85) {
        row.push(Tile.Obstacle); // Akadály
      } else if (rand < 0.90) {
        row.push(Tile.Blue); // Kék ásvány
      } else if (rand < 0.95) {
        row.push(Tile.Yellow); // Sárga ásvány
      } else {
        row.push(Tile.Green); // Zöld ásvány
      }
    }
    mapArray.push(row);
  }
  return mapArray;
}

/**
 * @async
 * URL-lel megadott fájlból készít mező-térképet.
 * @param {string} URL fájl URL
 * @param {boolean} isText
 * @returns {Promise<Tile[][]>} map `Promise<Tile[][]>`
 */
export async function readMap(URL: string, isText = false): Promise<Tile[][]> {
  let lines: string[] = [];
  if (!isText) {
    await fetch(URL).then(res => res.text()).then(async (data) => {
      lines = data.split("\n").filter(line => line.trim() != "");
    })
  } else {
    lines = URL.split("\n").filter(line => line.trim() != "");
  }
  const map: Tile[][] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() == "") continue;
    map.push([]);
    const currentRow = map[map.length - 1];
    const tiles = lines[i].trim().split(',').map((s): Tile => {
      return toTile(s)
    })
    tiles.forEach(t => currentRow.push(t));

  }
  return map;
}

/**
 * Megnézi, hogy a térkép nem 0 és van kezdőpontja.
 * @return {boolean} `true` ha érvényes, `false` ha nem
 */
export const isValidMap = (map: Tile[][]): boolean => {
  return map.length > 0 && map.find(row => row.find(tile => tile == Tile.Start)) != undefined;
}

/**
 * Visszaadja a kezdőpont pozícióját.
 * @param {Tile[][]} map `Tile[][]`
 * @returns {Position} `Position`
 */
export const getStartingPoint = (map: Tile[][]): Position => {
  const position: Position = { x: 0, y: 0 }
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] == Tile.Start) {
        return { x: x, y: y }
      }
    }
  }
  return position
}

/**
 * "Primitív" mezőkből álló térképet alakít át változatosabb mezőkké.
 * @param {Tile[][]} map `Tile[][]`
 * @returns {[boolean, Tile, Tile|null][][]} finom térkép [bányászott-e, eredeti, módosított?][][]
 */
export const generateFlavoredMap = (map: Tile[][]): [boolean, Tile, Tile|null][][] => {
  const flavoredMap: [boolean, Tile, Tile|null][][] = [];
  for (let y = 0; y < map.length; y++) {
    flavoredMap.push([]);
    for (let x = 0; x < map[y].length; x++) {
      const tiletype = map[y][x];
      flavoredMap[y].push([
        false,
        randomTileFrom(tiletype),
        null,
      ])
    }
  }
  return flavoredMap;
}

/**
 * Primitív mezőből készít véletlenszerűen egy részleteset.
 * @param {Tile} t Tile 
 * @returns {Tile} Részletes mező - Tile
 */
export const randomTileFrom = (t: Tile): Tile => { 
  let range: [number, number] = [0, 0];

  switch (t) {
    case Tile.Start: 
      return 5 as Tile;
    case Tile.Obstacle:
      range = [18, 21];
      break;
    case Tile.Empty:
      range = [6, 9];
      break;
    case Tile.Blue:
      range = [9, 12];
      break;
    case Tile.Yellow:
      range = [12, 15];
      break;
    case Tile.Green:
      range = [15, 18];
      break;
  }

  let int = Math.floor(Math.random() * (range[1] - range[0])) + range[0];
  return int as Tile;
};