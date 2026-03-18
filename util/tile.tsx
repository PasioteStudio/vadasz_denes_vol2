import { Position } from "@/types/RoverContextTypes";
import { Tile } from "../lib/constants";

export interface Action {
    action:"move"|"mine"|"move2"|"wait",
    positions:Position[]
}

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