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
    // cached to avoid recomputing in expand
    lastPos: Position,
    prevPos: Position,
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
    const beamWidth = 17;
    const moveableGrid = map.map(row => row.map(tile => tile == Tile.Obstacle ? 0 : 1));
    const graph = new Graph(moveableGrid, { diagonal: true });

    // Transposed grid for planReturnPath — library uses grid[x][y] in that context
    const rows = moveableGrid.length;
    const cols = moveableGrid[0].length;
    const transposedGrid = Array.from({ length: cols }, (_, x) =>
        Array.from({ length: rows }, (_, y) => moveableGrid[y][x])
    );
    const transposedGraph = new Graph(transposedGrid, { diagonal: true });

    const start = getStartingPoint(map);

    // Precompute ore positions once — passed into expand/calculateMoveScore
    const orePositions: Position[] = [];
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            if (isOre(map[row][col])) orePositions.push({ x: col, y: row });
        }
    }

    let beam: BeamItem[] = [
        {
            score: 0,
            sequence: [[{ from: start, to: start, mode: "move" }]],
            energy: 100,
            map: map.map(row => [...row]),
            lastPos: start,
            prevPos: start,
        },
    ]

    // Track only the single best completed item instead of all of them
    let bestCompleted: BeamItem | null = null;

    //solve
    for (let step = 0; step < moves; step++) {

        const candidates: BeamItem[] = [];

        for (const item of beam) {
            const position = item.lastPos;
            const returnHome = astar.search(transposedGraph, transposedGraph.grid[position.x][position.y], transposedGraph.grid[start.x][start.y]);

            if (!canReach(returnHome.length, item.energy, step + 2, moves)) {
                continue;
            }

            const expansions = expand(item, moveableGrid, orePositions);

            for (const e of expansions) {
                const lastStep = e.steps[e.steps.length - 1];
                const newPos = lastStep.to;
                const newScore = item.score + e.dscore;
                const newEnergy = Math.max(0, Math.min(item.energy + e.denergy, 100));

                const returnHome = astar.search(transposedGraph, transposedGraph.grid[newPos.x][newPos.y], transposedGraph.grid[start.x][start.y]);
                if (!canReach(returnHome.length, newEnergy, step + 2, moves)) continue;

                const newmap = item.map.map(row => [...row]);
                e.changes.forEach(change => {
                    newmap[change.where.y][change.where.x] = change.to;
                });

                // prevPos: second-to-last position across the whole sequence
                const prevPos = e.steps.length >= 2
                    ? e.steps[e.steps.length - 2].from
                    : item.lastPos;

                const newItem: BeamItem = {
                    sequence: [...item.sequence, e.steps],
                    score: newScore,
                    energy: newEnergy,
                    map: newmap,
                    lastPos: newPos,
                    prevPos,
                }

                if (bestCompleted === null || newScore > bestCompleted.score) {
                    bestCompleted = newItem;
                }
                candidates.push(newItem);
            }
        }

        candidates.sort((a, b) => b.score - a.score);
        beam = candidates.slice(0, beamWidth);
        if (beam.length === 0) break;

    }

    const winner = bestCompleted!;
    const lastMove = winner.lastPos;

    const returnMoves = planReturnPath(
        transposedGraph,
        lastMove,
        start,
        winner.energy,
        winner.sequence.length - 1,
        moves
    );

    console.log(returnMoves)

    if (returnMoves) {
        for (const tick of returnMoves) {
            winner.sequence.push(tick);
        }
    } else {
        console.warn("Could not return to start within energy/ticks");
    }
    const path = winner.sequence.map(ms => ms.map(m => m.to));
    const deltas = generateDeltas(winner.sequence, map);

    return { path, deltas }
}

const directions = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],/*--------*/[1, 0],
    [-1, 1], [0, 1], [1, 1],
]

const expand = (item: BeamItem, grid: (0 | 1)[][], orePositions: Position[]): Expansion[] => {

    const nextTick = item.sequence.length;
    const chargeAmount = nextTick % 48 >= 32 ? 0 : dayCharge;

    const possibleActions: action[] = [];
    const lastPos = item.lastPos;

    const standingOnOre = isOre(item.map[lastPos.y][lastPos.x]);

    if (standingOnOre) {
        if (consumption[action.mine] <= item.energy) possibleActions.push(action.mine);
    } else {
        if (consumption[action.move1] <= item.energy) possibleActions.push(action.move1);
        if (consumption[action.move2] <= item.energy) possibleActions.push(action.move2);
        if (consumption[action.move3] <= item.energy) possibleActions.push(action.move3);
    }

    if (possibleActions.length === 0) possibleActions.push(action.standby);

    const expansions: Expansion[] = [];

    for (const possibility of possibleActions) {

        // STANDBY
        if (possibility === action.standby) {
            expansions.push({
                denergy: chargeAmount - consumption[possibility],
                dscore: 0,
                steps: [{ from: lastPos, to: lastPos, mode: "wait" }],
                changes: [],
            });
            continue;
        }

        // MINE
        if (possibility === action.mine) {
            expansions.push({
                denergy: chargeAmount - consumption[possibility],
                dscore: 1100,
                steps: [{ from: lastPos, to: lastPos, mode: "mine", ore: item.map[lastPos.y][lastPos.x] }],
                changes: [{ where: { ...lastPos }, to: Tile.Empty }]
            });
            continue;
        }

        const currentPos = lastPos;
        const prevPos = item.prevPos;

        // MOVE1
        if (possibility === action.move1) {
            for (const [dx, dy] of directions) {
                const nx = currentPos.x + dx;
                const ny = currentPos.y + dy;

                if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) continue;
                if (grid[ny][nx] === 0) continue;
                if (nx === prevPos.x && ny === prevPos.y) continue;

                expansions.push({
                    denergy: chargeAmount - consumption[possibility],
                    dscore: calculateMoveScore(item.map, { x: nx, y: ny }, orePositions, item.sequence, [
                        { from: currentPos, to: { x: nx, y: ny }, mode: "move" }
                    ]),
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
                    dscore: calculateMoveScore(item.map, { x: px, y: py }, orePositions, item.sequence, steps),
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
                    dscore: calculateMoveScore(item.map, { x: px, y: py }, orePositions, item.sequence, steps),
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
            logs.push({ message: `Várakozás...` })
        } else if (currentMove.mode == "mine") {
            logs.push({ message: `+1 ${tileToString(map[currentMove.to.y][currentMove.to.x])}` })
        } else {
            logs.push({ message: `Mozgás (${currentMove.to.x},${currentMove.to.y})` })
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

        if (dist >= 3 && e >= consumption[action.move3]) {
            e = Math.min(e - consumption[action.move3] + recharge, 100);
            dist -= 3;
        } else if (dist >= 2 && e >= consumption[action.move2]) {
            e = Math.min(e - consumption[action.move2] + recharge, 100);
            dist -= 2;
        } else if (e >= consumption[action.move1]) {
            e = Math.min(e - consumption[action.move1] + recharge, 100);
            dist -= 1;
        } else {
            // wait to recharge
            e = Math.min(e - consumption[action.standby] + recharge, 100);
        }

        t++;
    }

    return true;
}

// orePositions passed in — no recomputation per call
const calculateMoveScore = (
    map: Tile[][],
    pos: Position,
    orePositions: Position[],
    sequence: Move[][],
    candidateSteps: Move[]
): number => {
    if (orePositions.length === 0) return 10000;

    const encode = (x: number, y: number) => x * 1000 + y;

    const visitedSet = new Set<number>();
    const n = 0; // can be parameterized
    for (let i = Math.max(sequence.length - n, 0); i < sequence.length; i++) {
        for (const move of sequence[i]) {
            visitedSet.add(encode(move.to.x, move.to.y));
        }
    }

    const steppedOver = new Set<number>();
    for (let i = 0; i < candidateSteps.length - 1; i++) {
        steppedOver.add(encode(candidateSteps[i].to.x, candidateSteps[i].to.y));
    }

    let score = 0;
    for (const ore of orePositions) {
        if (!isOre(map[ore.y][ore.x])) continue;

        const dx = Math.abs(pos.x - ore.x);
        const dy = Math.abs(pos.y - ore.y);
        const dist = Math.max(dx, dy);
        const temp = dist + 0.1;
        const base = 1 / (temp * temp * Math.sqrt(temp));

        const key = encode(ore.x, ore.y);
        const alreadyVisited = visitedSet.has(key);
        const walkedOver = steppedOver.has(key);

        if (dist === 0) {
            score += alreadyVisited ? -30 : base * 10;
        } else if (dist === 1) {
            score += alreadyVisited ? -10 : base * 0.5;
        } else {
            score += alreadyVisited ? -10 : base;
        }

        if (walkedOver) score -= 30;
    }

    // Extra penalty for candidate steps revisiting
    for (const step of candidateSteps) {
        if (visitedSet.has(encode(step.to.x, step.to.y))) score -= 30;
    }

    return score;
};

export function planReturnPath(
    graph: InstanceType<typeof Graph>,
    currentPos: Position,
    start: Position,
    energy: number,
    currentTick: number,
    maxTick: number
): Move[][] {
    const rawPath = astar.search(
        graph,
        graph.grid[currentPos.x][currentPos.y],
        graph.grid[start.x][start.y]
    );

    if (rawPath.length === 0 && (currentPos.x !== start.x || currentPos.y !== start.y)) {
        console.warn("No path found to start");
        return [];
    }

    const posSequence: Position[] = [
        currentPos,
        ...rawPath.map(n => ({ x: n.x, y: n.y }))
    ];

    const ticks: Move[][] = [];
    let e = energy;
    console.log(e)
    let tick = currentTick;
    let posIndex = 0;

    while (posIndex < posSequence.length - 1) {
        const chargeAmount = tick % 48 < 32 ? dayCharge : 0;
        const remaining = posSequence.length - 1 - posIndex;

        if (remaining >= 3 && e >= consumption[action.move3]) {
            ticks.push([
                { from: posSequence[posIndex], to: posSequence[posIndex + 1], mode: "move" },
                { from: posSequence[posIndex + 1], to: posSequence[posIndex + 2], mode: "move" },
                { from: posSequence[posIndex + 2], to: posSequence[posIndex + 3], mode: "move" },
            ]);
            e = Math.min(e - consumption[action.move3] + chargeAmount, 100);
            posIndex += 3;
        } else if (remaining >= 2 && e >= consumption[action.move2]) {
            ticks.push([
                { from: posSequence[posIndex], to: posSequence[posIndex + 1], mode: "move" },
                { from: posSequence[posIndex + 1], to: posSequence[posIndex + 2], mode: "move" },
            ]);
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
            ticks.push([{ from: posSequence[posIndex], to: posSequence[posIndex], mode: "wait" }]);
            e = Math.min(e - consumption[action.standby] + chargeAmount, 100);
        }

        tick++;
    }

    while (tick < maxTick) {
        const chargeAmount = tick % 48 < 32 ? dayCharge : 0;
        ticks.push([{ from: start, to: start, mode: "wait" }]);
        e = Math.min(e - consumption[action.standby] + chargeAmount, 100);
        tick++;
    }

    return ticks;
}