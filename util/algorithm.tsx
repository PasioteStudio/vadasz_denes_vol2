import { isOre, vectorValues, Tile, WeightPoint } from "@/util/constants";
import { Graph, astar } from "@/util/astar"
import { getNextStep, isDay, isThereAWay, stuck, TookAnotherStep } from "@/util/path"
import { Position } from "@/types/RoverContextTypes";
import { calculateTile } from "./tile";
import { Delta } from "@/types/MapTimelineContextTypes";
import { solve } from "./salesman"
import { findNearestOre } from "./ore";
import { deepCopy } from "./path";
import { Dispatch, SetStateAction } from "react";

enum TimeComplexity {
    FAST = 0.99999,
    REGULAR = 0.99999993,
    SLOW = 0.999999999
}

export function makePath(iterations: number, map: Tile[][],time_complexity?:TimeComplexity): { path: Position[], deltas: Delta[] } {
    if(!time_complexity){
        time_complexity = TimeComplexity.REGULAR
    }
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

    let final_path:{action:"move"|"mine",position:Position}[] = [];
    let go_home:{action:"move"|"mine",position:Position}[] = [];
    let temp_final_path:{action:"move"|"mine",position:Position}[] = [];
    let temp_go_home:{action:"move"|"mine",position:Position}[] = [];
    while(final_path.length + (final_path.length < 1 ? 0 : findNearestOre(final_path[final_path.length - 1].position.x,final_path[final_path.length - 1].position.y,update_able_map).distance) +  go_home.length < iterations){
        temp_final_path = final_path
        temp_go_home = go_home
        //METHOD 2: go with the flow ~
        let {my_path} = estimatePathWithWeight(map,obstacle_map,update_able_map,start,final_path.length < 1 ? start : final_path[final_path.length - 1].position,iterations - final_path.length)
        my_path = [...final_path,...my_path]
        
        //salesman
        const {ordered_path} = salesmanSolver(my_path.filter(i=>i.action == "mine").map(i=>i.position),obstacle_map,start,time_complexity)
        final_path = ordered_path

        let column:Position = ordered_path[ordered_path.length - 1].position
        const graphWithWeight = new Graph(obstacle_map.map((rows) => 
            rows.map((tile,idx) => tile === 1 ? 0 : 1)),  //if obstacle = 0 otherwise be 1 and the destination should be 1 aswell
            { diagonal: true });
        const startNode = graphWithWeight.grid[column.y][column.x];
        const endNode = graphWithWeight.grid[start.y][start.x];
        const astarpath = astar.search(graphWithWeight, startNode, endNode);
        go_home = astarpath.map(tile=>{return {action:"move",position:{x:tile.y,y:tile.x}}})
        
        console.log("salesman",ordered_path)
        console.log("regular",my_path.map(i=>i.position))
    }
    final_path = temp_final_path
    go_home = temp_go_home
    final_path = [...final_path,...go_home]
    //setting all the values
    for (let i = 0; i < final_path.length; i++) {
        deltas.push({
            energy: -1 + (isDay(i) ? 10 : 0),
            inventoryChanges: [],
            logsAdded: [{ message: "Állás itt: TODO" }],
            moves: [{
                from: i == 0 ? start : final_path[i - 1].position,
                to: final_path[i].position,
                mode: final_path[i].action,
            }],
        })
    }

    //waiting
    for (let i = final_path.length; i < iterations; i++) {
        final_path.push(final_path[i - 1])
        deltas.push({
            energy: -1 + (isDay(i) ? 10 : 0),
            inventoryChanges: [],
            logsAdded: [{ message: "Állás itt: TODO" }],
            moves: [{
                from: final_path[i - 1].position,
                to: final_path[i - 1].position,
                mode: "wait",
            }],
        })
    }

    return { path: final_path.map(i=>i.position), deltas }
}

// Salesman solver: given a set of ore positions, returns an optimally ordered
// path visiting all of them starting from `start`, using A* between each stop.
export function salesmanSolver(
    mine_positions: Position[],
    obstacle_map: (0 | 1)[][],
    start: Position,
    time_complexity:TimeComplexity
): { ordered_path: { action: "move" | "mine", position: Position }[] } {
    const solution = solve(mine_positions, time_complexity, undefined, undefined, true);
    const ordered_points = solution.map((i: number) => mine_positions[i]);
    const ordered_path: { action: "move" | "mine", position: Position }[] = []
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
    map: Tile[][],
    obstacle_map: (0 | 1)[][],
    update_able_map: WeightPoint[],
    start: Position,
    end: Position,
    iterations: number
): { my_path: { action: "mine" | "move", position: Position }[] } {
    const my_path: { action: "mine" | "move", position: Position }[] = []
    let column = calculateTile(update_able_map, start.x, start.y)
    let we_are_stuck = false;
    let have_to_go_back = false

    while ((have_to_go_back || isThereAWay(column)) && my_path.length < iterations) {
        if (have_to_go_back) {
            const graphWithWeight = new Graph(obstacle_map.map((rows) =>
                rows.map((tile) => tile === 1 ? 0 : 1)),
                { diagonal: true });
            const startNode = graphWithWeight.grid[column.y][column.x];
            const endNode = graphWithWeight.grid[end.y][end.x];
            const astarpath = astar.search(graphWithWeight, startNode, endNode);
            if (astarpath.length < 1) break
            column = calculateTile(update_able_map, astarpath[0].y, astarpath[0].x)
            my_path.push({ action: "move", position: { x: column.x, y: column.y } })
            continue
        }

        let next_column = calculateTile(update_able_map, column.x + column.endPoint.relative_x, column.y + column.endPoint.relative_y)

        if (we_are_stuck || my_path.slice(-2).filter(tile => (tile.position.x == next_column.x && tile.position.y == next_column.y) || (column.x == tile.position.x && tile.position.y == column.y)).length > 0) {
            const { next_column_to_go } = stuck(column, update_able_map, obstacle_map)
            column = calculateTile(update_able_map, next_column_to_go.x, next_column_to_go.y)

            const tile_id_temp = update_able_map.findIndex(tile => tile.y == column.y && tile.x == column.x)
            const tile_id = update_able_map[tile_id_temp].weight != 0 ? tile_id_temp : null
            if (tile_id !== null) {
                we_are_stuck = false
                const tileY = Math.floor(tile_id / map[0].length);
                const tileX = tile_id % map[0].length;
                map = deepCopy(map)
                map[tileY][tileX] = Tile.Empty
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

        const tile_id_temp = update_able_map.findIndex(tile => tile.y == column.y && tile.x == column.x)
        const tile_id = update_able_map[tile_id_temp].weight != 0 ? tile_id_temp : null
        if (tile_id !== null) {
            const tileY = Math.floor(tile_id / map[0].length);
            const tileX = tile_id % map[0].length;
            map = deepCopy(map)
            map[tileY][tileX] = Tile.Empty
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