import { Tile } from "@/util/constants"
import { Position, RoverT } from "./RoverContextTypes"

export type MapSnapshot = {
    fields: Field[],
    rover: RoverT
}
export type Field = {
    position: Position,
    tile: Tile,
}