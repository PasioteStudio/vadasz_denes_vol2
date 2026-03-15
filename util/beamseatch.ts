import { isOre, Tile } from "@/lib/constants";
import { Delta, InventoryChange, Move } from "@/types/MapTimelineContextTypes";
import { Log, Position } from "@/types/RoverContextTypes";
import { getStartingPoint } from "./map";
import { mapToOrePositions } from "./ore";
import { Graph, astar } from "@/lib/astar"
import { getlast, tileToString } from "./tile";
import { clamp } from "three/src/math/MathUtils.js";

type BeamItem = {
    sequence: Move[][],
    score: number,
    energy: number,
}
type Expansion = {
    steps: Move[],
    dscore: number,
    denergy: number,
}
enum action { standby, mine, move1 };
// enum action {standby, mine, move1, move2, move3};
const consumption: Record<action, number> = {
    [action.standby]: 1,
    [action.mine]: 2,
    [action.move1]: 2,
    // "move2": 8,
    // "move3": 18,
}
const dayCharge = +10;

export function beamsolve(moves: number, map: Tile[][]): { path: Position[][], deltas: Delta[] } {
    const beamWidth = 70; // this will somehow have to be improved
    // get ores
    const ores: Position[] = mapToOrePositions(map);
    const moveableGrid = new Graph(map.map(row => row.map(tile => tile == Tile.Obstacle ? 0 : 1)), { diagonal: true });
    // start tile
    const start = getStartingPoint(map);
    // beam
    let beam: BeamItem[] = [
        { score: 0, sequence: [[{ from: start, to: start, mode: "move" }]], energy: 100 },
    ]
    // array for beams that have returned
    const completed: BeamItem[] = [];


    //solve
    for (let step = 0; step < moves; step++) {

        const candidates: BeamItem[] = [];

        for (const item of beam) {

            const expansions = expand(item, moveableGrid.grid, map);

            for (const e of expansions) {

                const newSequence = [...item.sequence, e.steps];
                const newScore = item.score + e.dscore;
                const newEnergy = Math.max(0, Math.min(item.energy + e.denergy, 100));

                if (newEnergy < 0) continue;

                // if we returned to start (cycle complete)
                if (e.steps[e.steps.length - 1].to.x === start.x && e.steps[e.steps.length - 1].to.y === start.y && newSequence.length > 1) {
                    completed.push({
                        sequence: newSequence,
                        score: newScore,
                        energy: newEnergy
                    });
                } else {
                    candidates.push({
                        sequence: newSequence,
                        score: newScore,
                        energy: newEnergy
                    });
                }
            }
        }

        candidates.sort((a, b) => a.score - b.score);
        beam = candidates.slice(0, beamWidth);
    }


    // get the best beam path
    const winner = completed.sort((a, b) => a.score - b.score)[0];
    console.log(winner)
    const path = winner.sequence.map(ms => ms.map(m => m.to));
    const deltas = generateDeltas(winner.sequence, map);

    return {
        path: path,
        deltas: deltas
    }
}
const directions = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],/*--------*/[1, 0],
    [-1, 1], [0, 1], [1, 1],
]

const expand = (item: BeamItem, grid: never[][], map: Tile[][]): Expansion[] => {
    const currentTick = item.sequence.length - 1;
    const chargeAmount = currentTick % 48 >= 32 ? 0 : dayCharge;
    const actions = Object.values(action).filter(
        (v): v is action => typeof v === "number"
    );
    const possibleActions: action[] = [];
    const lastSequence = getlast(item.sequence);
    const lastMove = getlast(lastSequence);

    //get the actions that the energy allows
    for (const a of actions) {
        if (consumption[a] > item.energy) continue;
        if (a == action.mine && !isOre(map[lastMove.to.y][lastMove.to.x])) continue;
        possibleActions.push(a);
    }
    if (possibleActions.length == 0) possibleActions.push(action.standby)

    console.log(possibleActions)

    //for each possibility, create the expansion
    const expansions: Expansion[] = [];
    for (const possibility of possibleActions) {
        //standby
        if (possibility == action.standby) {
            expansions.push({
                denergy: chargeAmount - consumption[possibility],
                dscore: 0,
                steps: [{ from: lastMove.to, to: lastMove.to, mode: "wait" }]
            })
            continue;
        }
        //mine
        if (possibility == action.mine) {
            expansions.push({
                denergy: chargeAmount - consumption[possibility],
                dscore: 10,
                steps: [{ from: lastMove.to, to: lastMove.to, mode: "mine", ore: map[lastMove.to.y][lastMove.to.x] }] // TODO switch to modified map!
            })
            continue;
        }
        //move1
        const currentPos: Position = lastMove.to;
        if (possibility == action.move1) {
            for (let i = 0; i < directions.length; i++) {
                const newPos: Position = { x: currentPos.x + directions[i][0], y: currentPos.y + directions[i][1] }
                if (grid[newPos.y][newPos.x] == 0) continue; // barrier
                if (newPos.x == lastMove.from.x && newPos.y == lastMove.from.y) continue;
                expansions.push({
                    denergy: chargeAmount - consumption[possibility],
                    dscore: isOre(map[newPos.y][newPos.x]) ? 1 : 0, // TODO switch to modified map!
                    steps: [{ from: lastMove.to, to: newPos, mode: "move" }]
                })
            }
        }
        //move2
        //move3
    }

    return expansions;
}

const generateDeltas = (sequence: Move[][], map: Tile[][]): Delta[] => {
    const deltas: Delta[] = [];
    let energy = 100;

    for (let i = 0; i < sequence.length; i++) {
        const currentMoves = sequence[i];
        const chargeAmount = i % 48 >= 32 ? 0 : dayCharge;
        const actionCost = getActionCost(currentMoves)

        energy = clamp(energy - actionCost + chargeAmount, 0, 100);
        deltas.push({
            energy: energy,
            inventoryChanges: getInventoryChanges(currentMoves, map),
            logsAdded: getLogChanges(currentMoves, map),
            moves: currentMoves,
        })
    }
    return deltas;
}

const getActionCost = (moves: Move[]): number => {
    // if (moves.length == 3) return consumption[action.move3];
    // if (moves.length == 2) return consumption[action.move2];
    if (moves[0].mode == "mine") return consumption[action.mine];
    if (moves[0].mode == "wait") return consumption[action.standby];
    return 0;
}

const getInventoryChanges = (moves: Move[], map: Tile[][]): InventoryChange[] => {
    if (moves.find(m => m.mode == "mine") === undefined) return [];
    return [{ mode: "add", amount: 1, ore: map[moves[0].to.y][moves[0].to.x] as Tile.Blue | Tile.Yellow | Tile.Green }]
}

const getLogChanges = (moves: Move[], map: Tile[][]): Log[] => {
    const logs: Log[] = [];
    for (let i = 0; i < moves.length; i++) {
        const currentMove = moves[i];
        if (currentMove.mode == "wait") {
            logs.push({
                message: `Várakozás...`,
            })
        } else if (currentMove.mode == "mine") {
            logs.push({
                message: `+1 ${tileToString(map[currentMove.to.y][currentMove.to.x])}`
            })
        } else {
            const x = currentMove.to.x, y = currentMove.to.y;
            logs.push({
                message: `Mozgás (${x},${y})`
            })
        }
    }
    return logs;
}