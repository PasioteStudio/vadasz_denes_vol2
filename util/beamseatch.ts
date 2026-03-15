import { isOre, Tile } from "@/lib/constants";
import { Delta, Move } from "@/types/MapTimelineContextTypes";
import { Position } from "@/types/RoverContextTypes";
import { getStartingPoint } from "./map";
import { mapToOrePositions } from "./ore";
import { Graph, astar } from "@/lib/astar"
import { getlast } from "./tile";

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
type action = "standby" | "mine" | "move1" | "move2" | "move3";
const consumption: Record<string, number> = {
    "standby": 1,
    "mine": 2,
    "move1": 2,
    // "move2": 8,
    // "move3": 18,
}
const dayCharge = +10;

export function beamsolve(moves: number, map: Tile[][]): { path: Position[][], deltas: Delta[] } {
    const beamWidth = 30; // this will somehow have to be improved
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
                if (e.steps[e.steps.length - 1].to === start && newSequence.length > 1) {
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
    const path = winner.sequence.map(ms => ms.map(m => m.to));
    const deltas = generateDeltas(winner.sequence);

    return {
        path: path,
        deltas: deltas
    }
}
const directions = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],            [1, 0],
    [-1, 1], [0, 1], [1, 1],
]

const expand = (item: BeamItem, grid: never[][], map: Tile[][]): Expansion[] => {
    const currentTick = item.sequence.length - 1;
    const chargeAmount = currentTick % 48 >= 32 ? 0 : dayCharge;
    const actions = Object.keys(consumption) as action[];
    const possibleActions: action[] = [];
    const lastSequence = getlast(item.sequence);
    const lastMove = getlast(lastSequence);

    //get the actions that the energy allows
    for (const a in actions) {
        if (consumption[a] > item.energy) continue;
        if (a == "mine" && !isOre(map[lastMove.to.y][lastMove.to.x])) continue;
        possibleActions.push(a as action);
    }
    if (possibleActions.length == 0) possibleActions.push("standby")

    //for each possibility, create the expansion
    const expansions: Expansion[] = [];
    for (const possibility in possibleActions) {
        //standby
        if (possibility == "standby") {
            expansions.push({
                denergy: chargeAmount - consumption[possibility],
                dscore: 0,
                steps: [{ from: lastMove.to, to: lastMove.to, mode: "wait" }]
            })
            continue;
        }
        //mine
        if (possibility == "mine") {
            expansions.push({
                denergy: chargeAmount - consumption[possibility],
                dscore: 10,
                steps: [{ from: lastMove.to, to: lastMove.to, mode: "mine", ore: map[lastMove.to.y][lastMove.to.x] }] // TODO switch to modified map!
            })
            continue;
        }
        //move1
        const currentPos: Position = lastMove.to;
        if (possibility == "move1") {
            for (let i = 0; i < directions.length; i++) {
                const newPos: Position = { x: currentPos.x + directions[i][0], y: currentPos.y + directions[i][1] }
                if(grid[newPos.y][newPos.x] == 0) continue; // barrier
                if(newPos.x == lastMove.from.x && newPos.y == lastMove.from.y) continue;
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

const generateDeltas = (sequence: Move[][]): Delta[] => {
    return []
}