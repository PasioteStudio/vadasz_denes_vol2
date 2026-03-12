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
    "Obstacle",
    "Empty",
    "Blue",
    "Yellow",
    "Green",
    "Start",
    "EV1",
    "EV2",
    "EV3",
    "BV1",
    "BV2",
    "BV3",
    "YV1",
    "YV2",
    "YV3",
    "GV1",
    "GV2",
    "GV3",
    "OV1",
    "OV2",
    "OV3",
}
export const vectorValues={
    ore:1
}
export function isOre(tile:Tile){
    return [Tile.Green, Tile.Blue, Tile.Yellow].includes(tile)
}

export function energy_moving(speed:SPEED){
    /*
    Mozgáskor a fogyasztás a sebesség négyzetével arányos:
    Efelhasznált= k · v2
    ahol:
    v = a rover sebessége (blokk/fél óra)
    k = 2, állandó
    */

    //valami ilyesmi? nem
    const k = 2
    return k * Math.pow(speed,2)
}