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

            if (!canReach(returnHome.length, item.energy, step+1, moves-1)) {
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
                if (canReach(returnHome.length, newItem.energy, step+1, moves-1)) {
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
        for (const move of returnMoves) {
            winner.sequence.push([move]); // each move is its own tick
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
    graph: any,
    startPos: Position,
    endPos: Position,
    startEnergy: number,
    startTick: number,
    maxTick: number
): Move[] | null {

    const grid = graph.grid as GridNode[][];

    type Node = {
        pos: Position
        energy: number
        tick: number
        path: Move[]
    };

    const queue: Node[] = [{
        pos: startPos,
        energy: startEnergy,
        tick: startTick,
        path: []
    }];

    const visited = new Set<string>();

    const dirs = [
        [-1,-1],[0,-1],[1,-1],
        [-1,0],        [1,0],
        [-1,1],[0,1],[1,1]
    ];

    while (queue.length > 0) {

        const node = queue.shift()!;
        const key = `${node.pos.x},${node.pos.y},${node.energy},${node.tick}`;

        if (visited.has(key)) continue;
        visited.add(key);

        // reached base
        if (node.pos.x === endPos.x && node.pos.y === endPos.y) {
            return node.path;
        }

        if (node.tick >= maxTick || node.energy <= 0) continue;

        const recharge = node.tick % 48 < 32 ? dayCharge : 0;

        // try move1 move2 move3
        for (const move of [1,2,3] as MoveDistance[]) {

            const moveCost = consumption[move as action];

            if (node.energy < moveCost) continue;

            for (const [dx,dy] of dirs) {

                let cx = node.pos.x;
                let cy = node.pos.y;
                let valid = true;

                // walk intermediate tiles
                for (let step = 1; step <= move; step++) {

                    cx += dx;
                    cy += dy;

                    if (cx < 0 || cy < 0 || cx >= grid[0].length || cy >= grid.length) {
                        valid = false;
                        break;
                    }

                    const tile = grid[cy][cx] as GridNode;

                    if (tile.isWall()) {
                        valid = false;
                        break;
                    }
                }

                if (!valid) continue;

                queue.push({
                    pos: { x: cx, y: cy },
                    energy: node.energy - moveCost + recharge,
                    tick: node.tick + 1,
                    path: [
                        ...node.path,
                        { from: node.pos, to: { x: cx, y: cy }, mode: "move" }
                    ]
                });
            }
        }
    }

    return null;
}