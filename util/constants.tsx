"use client"

import { useMemo } from "react"

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

export interface VectorField {
  x: number;
  y: number;
  //vector: { dx: number; dy: number };  // direction and magnitude
  magnitude: number;
  endPoint:{relative_x:number,relative_y:number}
  angleDeg360: number;
}
export enum Tile {
    "Obstacle",
    "Empty",
    "Blue",
    "Yellow",
    "Green",
    "Start",
}
export const vectorValues={
    ore:1
}
export const ores = [Tile.Green, Tile.Blue, Tile.Yellow]
export const mapConstraints = {
    width:50,
    height:50
}
export class Rover {
    speed:SPEED
    to_extract_ore = 1 /*Egy ásvány kibányászása fél óráig tart. Eközben az adott blokkon áll a rover.*/
    daylight_powering = 10  /* Nappal az akkumulátor +10 egységet töltődik fél óra alatt. Éjszaka az akkumulátor nem töltődik. */
    power = {  //A rovernek van 100 egységnyi akkumulátor kapacitása.
        max:100,
        min:0,
        current:100
    }
    constructor(speed?:SPEED) {
        this.speed = speed ? speed : SPEED.MEDIUM
    }
    energy_moving = ()=>{
        /*
        Mozgáskor a fogyasztás a sebesség négyzetével arányos:
        Efelhasznált= k · v2
        ahol:
        v = a rover sebessége (blokk/fél óra)
        k = 2, állandó
        */

        //valami ilyesmi? nem
        return useMemo(()=>{
            const k = 2
            return k * Math.pow(this.speed,2)
        }, [this.speed])
    }
    


}