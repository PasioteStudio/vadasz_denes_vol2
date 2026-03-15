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
    map: Tile[][],
}
type Expansion = {
    steps: Move[],
    dscore: number,
    denergy: number,
    changes: { where: Position, to: Tile }[],
}

enum action { standby, mine, move1, move2, move3 };
const consumption: Record<action, number> = {
    [action.standby]: 1,
    [action.mine]: 2,
    [action.move1]: 2,
    [action.move2]: 8,
    [action.move3]: 18,
}
const dayCharge = +10;

export function beamsolve(moves: number, map: Tile[][]): { path: Position[][], deltas: Delta[] } {
    const beamWidth = 30; // this will somehow have to be improved
    // get ores
    const ores: Position[] = mapToOrePositions(map);
    const moveableGrid = map.map(row => row.map(tile => tile == Tile.Obstacle ? 0 : 1));
    const graph = new Graph(moveableGrid, { diagonal: true });
    // start tile
    const start = getStartingPoint(map);
    // beam
    let beam: BeamItem[] = [
        { score: 0, sequence: [[{ from: start, to: start, mode: "move" }]], energy: 100, map: [...map.map(row => [...row])] },
    ]
    // array for beams that have returned
    const completed: BeamItem[] = [];


    //solve
    for (let step = 0; step < moves; step++) {

        const candidates: BeamItem[] = [];

        for (const item of beam) {
            const smoves = item.sequence[item.sequence.length - 1];
            const position = smoves[smoves.length - 1].to

            const returnHome = astar.search(graph, graph.grid[position.y][position.x], graph.grid[start.y][start.x]);

            if (!canReach(returnHome.length, item.energy, step, moves)) {
                continue;
            }

            const expansions = expand(item, moveableGrid);

            for (const e of expansions) {

                const newSequence = [...item.sequence, e.steps];
                const newScore = item.score + e.dscore;
                const newEnergy = Math.max(0, Math.min(item.energy + e.denergy, 100));

                const newmap = [...item.map.map(row => [...row])];
                e.changes.forEach(change => {
                    newmap[change.where.y][change.where.x] = change.to;
                });


                const newItem = {
                    sequence: newSequence,
                    score: newScore,
                    energy: newEnergy,
                    map: newmap,
                }
                const smoves = newItem.sequence[newItem.sequence.length - 1];
                const position = smoves[smoves.length - 1].to
                const returnHome = astar.search(graph, graph.grid[position.y][position.x], graph.grid[start.y][start.x]);
                // if we returned to start (cycle complete)
                if (canReach(returnHome.length, newItem.energy, step, moves)) {
                    completed.push(newItem);
                    candidates.push(newItem);
                } 
                
            }
        }

        candidates.sort((a, b) => b.score - a.score);
        beam = candidates.slice(0, beamWidth);
    }


    // get the best beam path
    const winner = completed.sort((a, b) => b.score - a.score)[0];
    console.log(winner.score, winner)
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

const expand = (item: BeamItem, grid: (0 | 1)[][]): Expansion[] => {
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
        if (a == action.mine && !isOre(item.map[lastMove.to.y][lastMove.to.x])) continue;
        possibleActions.push(a);
    }
    if (possibleActions.length == 0) possibleActions.push(action.standby)




    //for each possibility, create the expansion
    const expansions: Expansion[] = [];
    for (const possibility of possibleActions) {
        //standby
        if (possibility == action.standby) {
            expansions.push({
                denergy: chargeAmount - consumption[possibility],
                dscore: 0,
                steps: [{ from: lastMove.to, to: lastMove.to, mode: "wait" }],
                changes: [],
            })
            continue;
        }
        //mine
        if (possibility == action.mine) {
            expansions.push({
                denergy: chargeAmount - consumption[possibility],
                dscore: 500,
                steps: [{ from: lastMove.to, to: lastMove.to, mode: "mine", ore: item.map[lastMove.to.y][lastMove.to.x] }],
                changes: [{ where: { ...lastMove.to }, to: Tile.Empty }]
            })
            continue;
        }
        //move1 TODO move2 and move3
        const currentPos: Position = lastMove.to;
        if (possibility == action.move1 || possibility == action.move2 || possibility == action.move3) {
            const flat = item.sequence.flat();
            const prev2 = flat[Math.max(0, flat.length - 2)]
            for (let i = 0; i < directions.length; i++) {
                const newPos: Position = { x: currentPos.x + directions[i][0], y: currentPos.y + directions[i][1] }
                if (grid[newPos.y][newPos.x] == 0) continue; // barrier
                if (newPos.x == prev2.to.x && newPos.y == prev2.to.y) continue;
                if (newPos.x == lastMove.from.x && newPos.y == lastMove.from.y) continue;
                const record: Expansion = {
                    denergy: chargeAmount - consumption[possibility],
                    dscore: calculateMoveScore(item.map, newPos),
                    steps: [{ from: lastMove.to, to: newPos, mode: "move" }],
                    changes: [],
                }
                expansions.push(record)
                // console.log(record);
            }
            continue;
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
            energy: - actionCost + chargeAmount,
            inventoryChanges: getInventoryChanges(currentMoves, map),
            logsAdded: getLogChanges(currentMoves, map),
            moves: currentMoves,
        })
    }
    return deltas;
}

const getActionCost = (moves: Move[]): number => {
    if (moves.length == 3) return consumption[action.move3];
    if (moves.length == 2) return consumption[action.move2];
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

function canReach(
    distance: number,
    energy: number,
    tick: number,
    maxTick: number
): boolean {
    // Base cases
    if (distance <= 0) return true;        // Reached the goal
    if (tick >= maxTick || energy < 0) return false; // Out of time or energy

    // Recharge calculation
    const recharge = tick % 48 < 32 ? 10 : 0;

    // Possible moves: [distance, energyCost]
    const moves: [number, number][] = [
        [1, 2],
        [2, 8],
        [3, 18],
    ];

    // Try each possible move
    for (const [moveDist, moveCost] of moves) {
        if (energy >= moveCost) {
            if (canReach(distance - moveDist, energy - moveCost + recharge, tick + 1, maxTick)) {
                return true;
            }
        }
    }

    return false;
}

const calculateMoveScore = (map: Tile[][], pos: Position): number => {
    const ores: Position[] = [];
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            const tile = map[row][col];
            if (!isOre(tile)) continue;
            ores.push({ x: col, y: row });
        }
    }

    let score = 0;
    for (const ore of ores) {
        const dx = Math.abs(pos.x - ore.x);
        const dy = Math.abs(pos.y - ore.y);
        const dist = Math.max(dx, dy); // Chebyshev distance
        score += 1 / (dist + 1);      // +1 to avoid division by zero
    }

    return score;
};