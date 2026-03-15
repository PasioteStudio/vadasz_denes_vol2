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
    const beamWidth = 50; // this will somehow have to be improved
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

            if (!canReach(returnHome.length, item.energy, step + 2, moves)) {
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
                if (canReach(returnHome.length, newItem.energy, step + 2, moves)) {
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
    const lastMove = getlast(getlast(winner.sequence)).to;

    const rawPath = astar.search(
        graph,
        graph.grid[lastMove.y][lastMove.x],
        graph.grid[start.y][start.x]
    );
    console.log("lastMove:", lastMove);
    console.log("start:", start);
    console.log("rawPath nodes:", rawPath.map(n => ({ x: n.x, y: n.y })));
    
    // Plan the return path
    const returnMoves = planReturnPath(
        graph,
        lastMove,
        start,
        winner.energy,
        winner.sequence.length - 1,
        moves
    );

    console.log("return", returnMoves)
    if (returnMoves) {
        for (const tick of returnMoves) {
            winner.sequence.push(tick); // tick is already Move[]
        }
    } else {
        console.warn("Could not return to start within energy/ticks");
    }
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

    for (const a of actions) {
        if (consumption[a] > item.energy) continue;
        if (a === action.mine && !isOre(item.map[lastMove.to.y][lastMove.to.x])) continue;
        possibleActions.push(a);
    }

    if (possibleActions.length === 0) possibleActions.push(action.standby);

    const expansions: Expansion[] = [];

    for (const possibility of possibleActions) {

        // STANDBY
        if (possibility === action.standby) {
            expansions.push({
                denergy: chargeAmount - consumption[possibility],
                dscore: 0,
                steps: [{ from: lastMove.to, to: lastMove.to, mode: "wait" }],
                changes: [],
            });
            continue;
        }

        // MINE
        if (possibility === action.mine) {
            expansions.push({
                denergy: chargeAmount - consumption[possibility],
                dscore: 500,
                steps: [{ from: lastMove.to, to: lastMove.to, mode: "mine", ore: item.map[lastMove.to.y][lastMove.to.x] }],
                changes: [{ where: { ...lastMove.to }, to: Tile.Empty }]
            });
            continue;
        }

        const currentPos: Position = lastMove.to;
        const flat = item.sequence.flat();
        const prev2 = flat[Math.max(0, flat.length - 2)];

        // MOVE1
        if (possibility === action.move1) {
            for (const [dx, dy] of directions) {
                const nx = currentPos.x + dx;
                const ny = currentPos.y + dy;

                // bounds check
                if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) continue;
                if (grid[ny][nx] === 0) continue;
                if (prev2 && nx === prev2.to.x && ny === prev2.to.y) continue;
                if (nx === lastMove.from.x && ny === lastMove.from.y) continue;

                expansions.push({
                    denergy: chargeAmount - consumption[possibility],
                    dscore: calculateMoveScore(item.map, { x: nx, y: ny }),
                    steps: [{ from: currentPos, to: { x: nx, y: ny }, mode: "move" }],
                    changes: [],
                });
            }
            continue;
        }

        // MOVE2
        if (possibility === action.move2) {
            for (const [dx, dy] of directions) {

                let px = currentPos.x;
                let py = currentPos.y;
                const steps: Move[] = [];

                for (let step = 0; step < 2; step++) {
                    const nx = px + dx;
                    const ny = py + dy;

                    if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) {
                        steps.length = 0;
                        break;
                    }
                    if (grid[ny][nx] === 0) {
                        steps.length = 0;
                        break;
                    }

                    steps.push({ from: { x: px, y: py }, to: { x: nx, y: ny }, mode: "move" });
                    px = nx;
                    py = ny;
                }

                if (steps.length !== 2) continue;
                if (px === currentPos.x && py === currentPos.y) continue;

                expansions.push({
                    denergy: chargeAmount - consumption[possibility],
                    dscore: calculateMoveScore(item.map, { x: px, y: py }),
                    steps,
                    changes: [],
                });
            }
            continue;
        }

        // MOVE3
        if (possibility === action.move3) {
            for (const [dx, dy] of directions) {

                let px = currentPos.x;
                let py = currentPos.y;
                const steps: Move[] = [];

                for (let step = 0; step < 3; step++) {
                    const nx = px + dx;
                    const ny = py + dy;

                    if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) {
                        steps.length = 0;
                        break;
                    }
                    if (grid[ny][nx] === 0) {
                        steps.length = 0;
                        break;
                    }

                    steps.push({ from: { x: px, y: py }, to: { x: nx, y: ny }, mode: "move" });
                    px = nx;
                    py = ny;
                }

                if (steps.length !== 3) continue;
                if (px === currentPos.x && py === currentPos.y) continue;

                expansions.push({
                    denergy: chargeAmount - consumption[possibility],
                    dscore: calculateMoveScore(item.map, { x: px, y: py }),
                    steps,
                    changes: [],
                });
            }
            continue;
        }
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
    if (moves.length === 1) {
        if (moves[0].mode === "wait") return consumption[action.standby];
        if (moves[0].mode === "mine") return consumption[action.mine];
        if (moves[0].mode === "move") return consumption[action.move1];
    }
    if (moves.length === 2) return consumption[action.move2];
    if (moves.length === 3) return consumption[action.move3];

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
    pathLength: number,
    energy: number,
    tick: number,
    maxTick: number
): boolean {

    let dist = pathLength;
    let e = energy;
    let t = tick;

    while (dist > 0) {

        if (t >= maxTick) return false;

        const recharge = t % 48 < 32 ? dayCharge : 0;

        // prefer the longest move we can afford
        if (dist >= 3 && e >= consumption[action.move3]) {
            e = e - consumption[action.move3] + recharge;
            dist -= 3;
        }
        else if (dist >= 2 && e >= consumption[action.move2]) {
            e = e - consumption[action.move2] + recharge;
            dist -= 2;
        }
        else if (e >= consumption[action.move1]) {
            e = e - consumption[action.move1] + recharge;
            dist -= 1;
        }
        else {
            return false;
        }

        e = Math.min(e, 100);
        t++;
    }

    return true;
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

type MoveDistance = 1 | 2 | 3;
interface GridNode {
    x: number;
    y: number;
    weight: number;
    isWall(): boolean;
}

export function planReturnPath(
    graph: InstanceType<typeof Graph>,
    currentPos: Position,
    start: Position,
    energy: number,
    currentTick: number,
    maxTick: number
): Move[][] {  // <-- return Move[][] not Move[], each inner array is one tick
    const rawPath = astar.search(
        graph,
        graph.grid[currentPos.x][currentPos.y],
        graph.grid[start.x][start.y]
    );

    if (rawPath.length === 0 && (currentPos.x !== start.x || currentPos.y !== start.y)) {
        console.warn("No path found to start");
        return [];
    }

    const posSequence: Position[] = [currentPos, ...rawPath.map(n => ({ x: n.x, y: n.y }))];

    const ticks: Move[][] = [];
    let e = energy;
    let tick = currentTick;
    let posIndex = 0;

    const canMultiStep = (steps: number): boolean => {
        if (posIndex + steps >= posSequence.length) return false;
        const dx = posSequence[posIndex + 1].x - posSequence[posIndex].x;
        const dy = posSequence[posIndex + 1].y - posSequence[posIndex].y;
        for (let i = 1; i < steps; i++) {
            const ndx = posSequence[posIndex + i + 1].x - posSequence[posIndex + i].x;
            const ndy = posSequence[posIndex + i + 1].y - posSequence[posIndex + i].y;
            if (ndx !== dx || ndy !== dy) return false;
        }
        return true;
    };

    while (posIndex < posSequence.length - 1) {
        const chargeAmount = tick % 48 < 32 ? dayCharge : 0;

        if (canMultiStep(3) && e >= consumption[action.move3]) {
            const stepMoves: Move[] = [];
            for (let i = 0; i < 3; i++) {
                stepMoves.push({
                    from: posSequence[posIndex + i],
                    to: posSequence[posIndex + i + 1],
                    mode: "move",
                });
            }
            ticks.push(stepMoves); // one tick, 3 moves
            e = Math.min(e - consumption[action.move3] + chargeAmount, 100);
            posIndex += 3;
        } else if (canMultiStep(2) && e >= consumption[action.move2]) {
            const stepMoves: Move[] = [];
            for (let i = 0; i < 2; i++) {
                stepMoves.push({
                    from: posSequence[posIndex + i],
                    to: posSequence[posIndex + i + 1],
                    mode: "move",
                });
            }
            ticks.push(stepMoves); // one tick, 2 moves
            e = Math.min(e - consumption[action.move2] + chargeAmount, 100);
            posIndex += 2;
        } else if (e >= consumption[action.move1]) {
            ticks.push([{
                from: posSequence[posIndex],
                to: posSequence[posIndex + 1],
                mode: "move",
            }]);
            e = Math.min(e - consumption[action.move1] + chargeAmount, 100);
            posIndex += 1;
        } else {
            // wait to recharge
            ticks.push([{ from: posSequence[posIndex], to: posSequence[posIndex], mode: "wait" }]);
            e = Math.min(e - consumption[action.standby] + chargeAmount, 100);
        }

        tick++;
    }

    // Pad remaining ticks with waits at start
    while (tick < maxTick) {
        const chargeAmount = tick % 48 < 32 ? dayCharge : 0;
        ticks.push([{ from: start, to: start, mode: "wait" }]);
        e = Math.min(e - consumption[action.standby] + chargeAmount, 100);
        tick++;
    }

    return ticks;
}