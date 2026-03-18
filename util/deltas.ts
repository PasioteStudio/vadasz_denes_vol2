import { Delta, InventoryChange, Move } from "@/types/MapTimelineContextTypes"
import { Item, Log, Position } from "@/types/RoverContextTypes"
import { Tile } from "../lib/constants"
import { clamp } from "three/src/math/MathUtils.js"
import { randomTileFrom } from "./map"

export const processPositionChanges = (startPos: Position, delta: Move[], direction: -1 | 1): Position => {
    const deltas: Move[] = direction == 1 ? [...delta] : [...delta].reverse()
    let newPos = { ...startPos }
    deltas.forEach(d => {
        if(d.from.x == d.to.x && d.from.y == d.to.y) return;
        newPos = direction == 1 ? { x: d.to.x, y: d.to.y } : { x: d.from.x, y: d.from.y };
    })
    return newPos;
}

export const processInventoryChanges = (startInv: Item[], delta: InventoryChange[], direction: -1 | 1): Item[] => {
    const deltas = direction == 1 ? [...delta] : [...delta].reverse()
    let newInv = [...startInv];
    deltas.forEach(d => {
        if ((d.mode == "add" && direction == 1)
            || (d.mode == "remove" && direction == -1)) { // add item

            const entry = newInv.find(i => i.ore == d.ore);
            if (entry) {
                entry.amount += d.amount;
                newInv = [
                    ...newInv.filter(i => i.ore != entry.ore),
                    entry
                ]
                return;
            }
            newInv = [
                ...newInv.filter(i => i.ore != d.ore),
                { ore: d.ore, amount: d.amount }
            ]

        } else if ((d.mode == "remove" && direction == 1)
            || (d.mode == "add" && direction == -1)) {// remove item

            const entry = newInv.find(i => i.ore == d.ore);
            if (entry && entry.amount == d.amount) {
                newInv = [
                    ...newInv.filter(i => i.ore != entry.ore),
                ]
            } else if (entry){
                entry.amount -= d.amount;
                newInv = [
                    ...newInv.filter(i => i.ore != entry.ore),
                    entry
                ]
                return;
            }
        }
    })
    return newInv;
}

export const processLogChanges = (startLogs: Log[], addedLogs: Log[], direction: -1 | 1): Log[] => {
    const deltas = direction == 1 ? [...addedLogs] : [...addedLogs].reverse()
    let newLogs = [...startLogs];

    deltas.forEach(d => {
        if(direction == 1){
            newLogs.push(d)
            return;
        }
        newLogs = newLogs.filter((l,i) => i < newLogs.length-1)
    })
    return newLogs;
}

export const processMapChanges = (startMap: [boolean, Tile, Tile|null][][], roverMoves: Move[], direction: -1 | 1): [boolean, Tile, Tile|null][][] => {
    const deltas = direction == 1 ? [...roverMoves] : [...roverMoves].reverse()
    let newMap = startMap

    for (const d of deltas) {
        if (d.mode != "mine" || d.ore === undefined) continue;
        const prevEntry = newMap[d.to.y][d.to.x];
        if(prevEntry[2]===null){
            prevEntry[2] = randomTileFrom(Tile.Empty)
        }
        newMap[d.from.y][d.from.x] = [
            direction == 1,
            prevEntry[1],
            prevEntry[2]
        ]
    }

    return newMap;
}

export const getEnergyForTick = (tick: number, deltas: Delta[]): number => {
    const energyDeltas = deltas.slice(0,tick).map(d => d.energy);
    let energy = 100;

    for(let i = 0; i < energyDeltas.length; i++) {
        energy = clamp(energy+energyDeltas[i],0,100);
    }
    return energy
}