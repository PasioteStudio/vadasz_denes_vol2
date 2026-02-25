import { SPEED } from "@/util/constants"
import { Field, MapSnapshot } from "./MapTypes"

export type Position = {
    x: number,
    y: number,
} 
export type Item = {
    name: string,
    amount: number,
}
export type Log = {
    postition: Position,
    consumption: number,
    inventory: Item[],
    message: string,
}
export type RoverAction = {
    action: "mine" | "move" | "wait",
    target?: Field,
    speed?: SPEED
}
export type RoverContextT = {
    position: Position
    logs: Log[],
    inventory: Item[],
    startingPosition: Position
    energy: number
    currentAction: RoverAction
}