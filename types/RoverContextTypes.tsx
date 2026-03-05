import { SPEED, Tile } from "@/util/constants"
import { Field, MapSnapshot } from "./MapTypes"

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
export type RoverAction = {
    action: "mine" | "move" | "wait",
    target?: Field,
    speed?: SPEED
}
export type RoverT = {
    position: Position
    logs: Log[],
    inventory: Item[],
    startingPosition: Position
    energy: number
    currentAction: RoverAction
}