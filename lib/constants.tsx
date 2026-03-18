"use client"

export enum SPEED {
    SLOW= 1,
    MEDIUM = 2,
    FAST = 3,
}
export interface WeightPoint {
  x: number;
  y: number;
  weight: number;
}

export const TILE_GAP = 2.1;

export interface VectorField {
  x: number;
  y: number;
  endPoint:{relative_x:number,relative_y:number}
}

export enum Tile {
    "Obstacle","Empty","Blue","Yellow","Green","Start",

    "EV1","EV2","EV3",
    "BV1","BV2","BV3",
    "YV1","YV2","YV3",
    "GV1","GV2","GV3",
    "OV1","OV2","OV3",
}

export const vectorValues={
    ore:1
}

/**
 * Megadja, hogy az adott primitív mező érc e.
 * @param tile `Tile`
 * @returns `boolean`
 */
export function isOre(tile:Tile){
    return [Tile.Green, Tile.Blue, Tile.Yellow].includes(tile)
}