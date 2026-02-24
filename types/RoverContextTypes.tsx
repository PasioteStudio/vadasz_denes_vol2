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
    position: {
        get: Position,
        set: (position: Position) => void,
    },
    logs: {
        get: Log[],
        set: (logs: Log[]) => void,
    },
    inventory: {
        get: Item[],
        set: (items: Item[]) => void
    }
    startingPosition: {
        get: Position,
        set: (position: Position) => void,
    },
    energy: {
        get: number,
        set: (e: number) => void
    }
    currentAction: {
        get: RoverAction,
        set: (position: RoverAction) => void,
    },
}