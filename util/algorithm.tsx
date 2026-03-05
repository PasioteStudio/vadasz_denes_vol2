import { isOre, vectorValues, Tile, WeightPoint } from "@/util/constants";
import { Graph, astar } from "@/util/astar"
import { getNextStep, isDay, isThereAWay, stuck, TookAnotherStep } from "@/util/path"
import { Position } from "@/types/RoverContextTypes";
import { calculateTile } from "./tile";
import { Delta } from "@/types/MapTimelineContextTypes";

export function makePath(iterations: number, map: Tile[][]): { path: Position[], deltas: Delta[] } {
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

    const my_path: Position[] = []
    let column = calculateTile(update_able_map, start.x, start.y)
    let we_are_stuck = false;
    let have_to_go_back = false

    while ((have_to_go_back || isThereAWay(column)) && my_path.length < iterations) {
        if (have_to_go_back) {
            const graphWithWeight = new Graph(obstacle_map.map((rows) =>
                rows.map((tile) => tile === 1 ? 0 : 1)),
                { diagonal: true });
            const startNode = graphWithWeight.grid[column.y][column.x];
            const endNode = graphWithWeight.grid[start.y][start.x];
            const astarpath = astar.search(graphWithWeight, startNode, endNode);
            if (astarpath.length < 1) break
            column = calculateTile(update_able_map, astarpath[0].y, astarpath[0].x)
            TookAnotherStep(map, iterations, obstacle_map, start, my_path, { x: column.x, y: column.y }, update_able_map, deltas, null)
            continue
        }

        let next_column = calculateTile(update_able_map, column.x + column.endPoint.relative_x, column.y + column.endPoint.relative_y)

        if (we_are_stuck || my_path.slice(-2).filter(tile => (tile.x == next_column.x && tile.y == next_column.y) || (column.x == tile.x && tile.y == column.y)).length > 0) {
            const { next_column_to_go } = stuck(column, update_able_map, obstacle_map)
            column = calculateTile(update_able_map, next_column_to_go.x, next_column_to_go.y)

            const tile_id_temp = update_able_map.findIndex(tile => tile.y == column.y && tile.x == column.x)
            const tile_id = update_able_map[tile_id_temp].weight != 0 ? tile_id_temp : null
            if (update_able_map[tile_id_temp].weight != 0) {
                we_are_stuck = false
            }
            const step = TookAnotherStep(map, iterations, obstacle_map, start, my_path, { x: column.x, y: column.y }, update_able_map, deltas, tile_id)
            map = step.map
            have_to_go_back = step.go_back
            continue
        }

        if (obstacle_map[next_column.y][next_column.x] == 1) {
            const step = getNextStep(column.x, column.y, next_column.x + next_column.endPoint.relative_x, next_column.y + next_column.endPoint.relative_y, obstacle_map)
            next_column = calculateTile(update_able_map, column.x + step.dx, column.y + step.dy)
        }

        column = next_column

        const tile_id_temp = update_able_map.findIndex(tile => tile.y == column.y && tile.x == column.x)
        const tile_id = update_able_map[tile_id_temp].weight != 0 ? tile_id_temp : null
        const step = TookAnotherStep(map, iterations, obstacle_map, start, my_path, { x: column.x, y: column.y }, update_able_map, deltas, tile_id)
        map = step.map
        have_to_go_back = step.go_back
    }

    for (let i = my_path.length; i < iterations; i++) {
        my_path.push(my_path[i - 1])
        deltas.push({
            energy: -1 + (isDay(i) ? 10 : 0),
            inventoryChanges: [],
            logsAdded: [{ message: "Állás itt: TODO" }],
            moves: [{
                from: my_path[i - 1],
                to: my_path[i - 1],
                mode: "wait",
            }],
        })
        console.log("waiting delta set")
    }

    return { path: my_path, deltas }
}