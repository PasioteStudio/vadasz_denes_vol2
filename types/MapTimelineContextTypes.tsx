import { Tile } from "@/lib/constants"
import { Log, Position, RoverT } from "./RoverContextTypes"

export type MapTimelineContextT = {
    map: Tile[][],
    deltas: Delta[],
    rover: RoverT,
    startingPoint: Position,
    flavoredMap: [boolean, Tile, Tile|null][][]
}

export type Delta = {
    moves: Move[]
    inventoryChanges: InventoryChange[],
    energy: number,
    logsAdded: Log[]
}

export type Move = {
    mode: ("move"|"mine"|"wait"),
    from: Position,
    to: Position,
    ore?: Tile
}
export type InventoryChange = {
    mode: "add"|"remove",
    ore: Tile.Yellow | Tile.Green | Tile.Blue,
    amount: number
}