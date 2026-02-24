import { Tile } from "@/util/constants"
import { Position, RoverContextT } from "./RoverContextTypes"

export type MapSnapshot = {
    fields: Field[],
    rover: RoverContextT
}
export type Field = {
    position: Position,
    tile: Tile,
}