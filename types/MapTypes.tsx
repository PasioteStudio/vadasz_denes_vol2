import { Position, RoverContextT } from "./RoverContextTypes"
enum Tile {
    "Obstacle",
    "Empty",
    "Blue",
    "Yellow",
    "Green",
}
export type MapSnapshot = {
    fields: Field[],
    rover: RoverContextT
}
export type Field = {
    position: Position,
    tile: Tile,
}