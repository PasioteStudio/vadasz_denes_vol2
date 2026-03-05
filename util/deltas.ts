import { Delta, InventoryChange, Move } from "@/types/MapTimelineContextTypes"
import { Item, Log, Position } from "@/types/RoverContextTypes"
import { Tile } from "./constants"

export const processPositionChanges = (startPos: Position, delta: Move[], direction: -1|1) => {
    
}

export const processInventoryChanges = (startInv: Item[], delta: InventoryChange[], direction: -1|1) => {
    
}

export const processLogChanges = (startLogs: Log[], addedLogs: Log[], direction: -1|1) => {
    
}

export const processMapChanges = (startMap: Tile[][], moves: Move[], direction: -1|1) => {
    
}