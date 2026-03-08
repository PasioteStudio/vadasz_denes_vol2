import { isOre, vectorValues, Tile, WeightPoint } from "@/util/constants";
import { Graph, astar } from "@/util/astar"
import { getNextStep, isDay, isThereAWay, stuck, TookAnotherStep } from "@/util/path"
import { Position } from "@/types/RoverContextTypes";
import { calculateTile, tileToString } from "./tile";
import { Delta, InventoryChange } from "@/types/MapTimelineContextTypes";
import { solve } from "./salesman"
import { findNearestOre } from "./ore";
import { deepCopy } from "./path";

// NOTE: These values are the simulated annealing *temperature coefficient*.
// Counterintuitively, values closer to 1 = MORE iterations = SLOWER but better quality.
// TimeComplexity.FAST = 0.9999999 was actually ~184 million SA iterations.
// The enum is kept for reference but salesmanSolver now uses adaptiveTempCoeff() instead.
enum TimeComplexity {
    MINIMAL = 0.999999,
    FAST = 0.9999999,
    REGULAR = 0.99999993,
    SLOW = 0.99999999
}

interface Action {
    action:"move"|"mine",
    position:Position
}

/**
 * Computes a simulated annealing temperature coefficient scaled to the number
 * of points. For small ore counts (3–5) this yields ~10k–15k SA iterations;
 * for larger counts it scales up proportionally to keep solution quality reasonable.
 *
 * Formula: 1 - exp(-6 - n/10)
 * Examples: 3 pts → ~10k iters, 10 pts → ~20k iters, 20 pts → ~55k iters
 *
 * Compare: the hardcoded TimeComplexity.FAST = 0.9999999 gave 184 MILLION iters
 * regardless of whether there were 2 ores or 20.
 */
function adaptiveTempCoeff(pointCount: number): number {
    return 1 - Math.exp(-6 - pointCount / 10);
}

// Build a Position key → update_able_map index lookup for O(1) tile access.
function buildTileIndex(update_able_map: WeightPoint[]): Map<string, number> {
    const index = new Map<string, number>();
    update_able_map.forEach((t, i) => index.set(`${t.x},${t.y}`, i));
    return index;
}

const max_stack = 5
export function makePath(iterations: number, map: Tile[][], time_complexity: TimeComplexity = TimeComplexity.FAST): { path: Position[], deltas: Delta[] } {
    const deltas: Delta[] = [];

    let start: Position = { x: 0, y: 0 };
    let mapConstraints: { width: number, height: number } = { width: 0, height: 0 };
    const obstacle_map: (0 | 1)[][] = []
    let update_able_map: WeightPoint[] = []

    map.forEach((row, y) => {
        row.forEach((field, x) => {
            if (field == Tile.Start) start = { x: x, y: y }
            if (x + 1 > mapConstraints.width) mapConstraints.width = x + 1
            if (y + 1 > mapConstraints.height) mapConstraints.height = y + 1
            if (obstacle_map.length < y + 1) obstacle_map.push([field == Tile.Obstacle ? 1 : 0])
            else obstacle_map[y].push(field == Tile.Obstacle ? 1 : 0)
            update_able_map.push({ x: x, y: y, weight: isOre(field) ? vectorValues.ore : 0 })
        })
    })
    deltas.push({
        energy: 0,
        inventoryChanges: [],
        logsAdded: [],
        moves: [{ from: start, to: start, mode: "wait" }]
    })

    let final_path: Action[] = [];
    let go_home: Action[] = [];
    let temp_final_path: Action[] = [];
    let temp_go_home: Action[] = [];
    let weight_based_path: Action[] = []
    let current_stack = 0

    while (final_path.length + (final_path.length < 1 ? 0 : findNearestOre(final_path[final_path.length - 1].position.x, final_path[final_path.length - 1].position.y, update_able_map).distance) + go_home.length < iterations && current_stack < max_stack) {
        current_stack++
        temp_final_path = final_path
        temp_go_home = go_home

        //weight based path
        let { my_path } = estimatePathWithWeight(obstacle_map, update_able_map, final_path.length < 1 ? start : final_path[final_path.length - 1].position, start, iterations - final_path.length)
        my_path = [...final_path, ...my_path]
        //check if the calculated path collected the same ores like the previous calculation
        const current_ores = my_path.filter(i => i.action == "mine")
        const prev_ores = weight_based_path.filter(i => i.action == "mine")
        if (current_ores.length == prev_ores.length) break;

        weight_based_path = deepCopy(my_path)

        //salesman — use adaptive coeff scaled to ore count
        const { ordered_path } = salesmanSolver(current_ores.map(i => i.position), obstacle_map, start, current_ores.length)
        final_path = ordered_path

        const column: Position = ordered_path[ordered_path.length - 1].position
        const goHomeGraph = new Graph(
            obstacle_map.map(rows => rows.map(tile => tile === 1 ? 0 : 1)),
            { diagonal: true }
        );
        const startNode = goHomeGraph.grid[column.y][column.x];
        const endNode = goHomeGraph.grid[start.y][start.x];
        const astarpath = astar.search(goHomeGraph, startNode, endNode);
        go_home = astarpath.map(tile => { return { action: "move", position: { x: tile.y, y: tile.x } } })
    }

    //if the algorith ran more than once and the last one isnt valid, then replace it
    if (temp_final_path.length != 0 && final_path.length + go_home.length > iterations) {
        final_path = temp_final_path
        go_home = temp_go_home
    } else if (temp_final_path.length == 0 && final_path.length + go_home.length > iterations) {
        final_path = weight_based_path
    }
    final_path = [...final_path, ...go_home]

    //setting all the values
    for (let i = 0; i < final_path.length; i++) {
        const { x, y } = final_path[i].position;
        deltas.push({
            energy: -1 + (isDay(i) ? 10 : 0),
            inventoryChanges: (final_path[i].action == "mine" ? [{
                amount: 1,
                mode: "add",
                ore: map[y][x],
            } as InventoryChange] : []),
            logsAdded: [{ message: final_path[i].action == "mine" ? `+1 ${tileToString(map[y][x])}` :
                `Mozgás ide: ${final_path[i].position.x}, ${final_path[i].position.y}` }],
            moves: [{
                from: i == 0 ? start : final_path[i - 1].position,
                to: final_path[i].position,
                mode: final_path[i].action,
                ore: (final_path[i].action == "mine" ? map[y][x] : undefined)
            }],
        })
    }

    //waiting
    for (let i = final_path.length; i < iterations; i++) {
        final_path.push(final_path[i - 1])
        deltas.push({
            energy: -1 + (isDay(i) ? 10 : 0),
            inventoryChanges: [],
            logsAdded: [{ message: "Várakozás..." }],
            moves: [{
                from: final_path[i - 1].position,
                to: final_path[i - 1].position,
                mode: "wait",
            }],
        })
    }

    return { path: final_path.map(i => i.position), deltas }
}

// Salesman solver: given a set of ore positions, returns an optimally ordered
// path visiting all of them starting from `start`, using A* between each stop.
// oreCount drives the adaptive SA coefficient — more ores = more iterations allowed.
export function salesmanSolver(
    mine_positions: Position[],
    obstacle_map: (0 | 1)[][],
    start: Position,
    oreCount: number
): { ordered_path: Action[] } {
    // Adaptive coefficient: scales SA work to problem size instead of running
    // a fixed 184 million iterations regardless of how many ores there are.
    const coeff = adaptiveTempCoeff(oreCount);
    const solution = solve(mine_positions, coeff, undefined, undefined, true);
    const ordered_points = solution.map((i: number) => mine_positions[i]);
    const ordered_path: Action[] = []
    let current = start

    for (let i = 0; i < ordered_points.length; i++) {
        const target = ordered_points[i]
        while (!(current.x == target.x && current.y == target.y)) {
            const step = getNextStep(current.x, current.y, target.x, target.y, obstacle_map)
            current = { x: current.x + step.dx, y: current.y + step.dy }
            ordered_path.push({ action: "move", position: current })
        }
        ordered_path.push({ action: "mine", position: current })
    }

    return { ordered_path }
}

// Estimates a path using the vector field weight system, starting from `start` heading toward `end`.
// Returns a list of move/mine actions without generating deltas — used as input for salesmanSolver.
export function estimatePathWithWeight(
    obstacle_map: (0 | 1)[][],
    update_able_map: WeightPoint[],
    start: Position,
    end: Position,
    iterations: number
): { my_path: Action[] } {
    const my_path: Action[] = []
    let column = calculateTile(update_able_map, start.x, start.y)
    let we_are_stuck = false;
    let have_to_go_back = false

    // O(1) tile lookup instead of O(n) findIndex on every step
    const tileIndex = buildTileIndex(update_able_map);

    while ((have_to_go_back || isThereAWay(column)) && my_path.length < iterations) {
        if (have_to_go_back) {
            // Stop here — makePath will append the go_home A* path itself.
            // Walking home step-by-step here caused the go-home segment to appear
            // twice in the final path (once from this loop, once from go_home append).
            break
        }

        let next_column = calculateTile(update_able_map, column.x + column.endPoint.relative_x, column.y + column.endPoint.relative_y)

        if (we_are_stuck || my_path.slice(-2).filter(tile => (tile.position.x == next_column.x && tile.position.y == next_column.y) || (column.x == tile.position.x && tile.position.y == column.y)).length > 0) {
            const { next_column_to_go } = stuck(column, update_able_map, obstacle_map)
            column = calculateTile(update_able_map, next_column_to_go.x, next_column_to_go.y)

            const tile_id_temp = tileIndex.get(`${column.x},${column.y}`) ?? -1;
            const tile_id = tile_id_temp !== -1 && update_able_map[tile_id_temp].weight != 0 ? tile_id_temp : null
            if (tile_id !== null) {
                we_are_stuck = false
                update_able_map[tile_id].weight = 0
                my_path.push({ action: "move", position: { x: column.x, y: column.y } })
                my_path.push({ action: "mine", position: { x: column.x, y: column.y } })
            } else {
                my_path.push({ action: "move", position: { x: column.x, y: column.y } })
            }

            const graphWithWeight = new Graph(obstacle_map.map((rows) =>
                rows.map((tile) => tile === 1 ? 0 : 1)),
                { diagonal: true });
            const startNode = graphWithWeight.grid[column.y][column.x];
            const endNode = graphWithWeight.grid[end.y][end.x];
            const astarpath = astar.search(graphWithWeight, startNode, endNode);
            have_to_go_back = (my_path.length + astarpath.length) >= iterations - 1 || !isThereAWay(calculateTile(update_able_map, column.x, column.y))
            continue
        }

        if (obstacle_map[next_column.y][next_column.x] == 1) {
            const step = getNextStep(column.x, column.y, next_column.x + next_column.endPoint.relative_x, next_column.y + next_column.endPoint.relative_y, obstacle_map)
            next_column = calculateTile(update_able_map, column.x + step.dx, column.y + step.dy)
        }

        column = next_column

        const tile_id_temp = tileIndex.get(`${column.x},${column.y}`) ?? -1;
        const tile_id = tile_id_temp !== -1 && update_able_map[tile_id_temp].weight != 0 ? tile_id_temp : null
        if (tile_id !== null) {
            update_able_map[tile_id].weight = 0
            my_path.push({ action: "move", position: { x: column.x, y: column.y } })
            my_path.push({ action: "mine", position: { x: column.x, y: column.y } })
        } else {
            my_path.push({ action: "move", position: { x: column.x, y: column.y } })
        }

        const graphWithWeight = new Graph(obstacle_map.map((rows) =>
            rows.map((tile) => tile === 1 ? 0 : 1)),
            { diagonal: true });
        const startNode = graphWithWeight.grid[column.y][column.x];
        const endNode = graphWithWeight.grid[end.y][end.x];
        const astarpath = astar.search(graphWithWeight, startNode, endNode);
        have_to_go_back = (my_path.length + astarpath.length) >= iterations - 1 || !isThereAWay(calculateTile(update_able_map, column.x, column.y))
    }

    return { my_path }
}