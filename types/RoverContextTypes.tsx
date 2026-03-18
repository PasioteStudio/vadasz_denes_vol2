import { Tile } from "@/lib/constants"

export type Position = {
    x: number,
    y: number,
} 
export type Item = {
    ore: Tile.Blue | Tile.Green | Tile.Yellow,
    amount: number,
}
export type Log = {
    message: string,
}
export type RoverT = {
    position: Position,
    logs: Log[],
    inventory: Item[],
    startingPosition: Position
    energy: number
}