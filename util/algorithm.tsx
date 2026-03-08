import { isOre, vectorValues, Tile, WeightPoint } from "@/util/constants";
import { Graph, astar } from "@/util/astar"
import { getNextStep, isDay, isStuck, isThereAWay, stuck } from "@/util/path"
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

export interface Action {
    action:"move"|"mine"|"move2",
    position:Position
}

const max_stack = 5
export function makePath(iterations: number, map: Tile[][], time_complexity: TimeComplexity = TimeComplexity.FAST): { path: Position[], deltas: Delta[] } {
    const deltas: Delta[] = [];

    let start: Position = { x: 0, y: 0 };
    let mapConstraints: { width: number, height: number } = { width: 0, height: 0 };
    const obstacle_map: (0 | 1)[][] = []
    const update_able_map: WeightPoint[] = []

    map.forEach((row, y) => {
        row.forEach((field, x) => {
            if (field == Tile.Start) start = { x: x, y: y }
            if (x + 1 > mapConstraints.width) mapConstraints.width = x + 1
            if (y + 1 > mapConstraints.height) mapConstraints.height = y + 1
            if (obstacle_map.length < y + 1) obstacle_map.push([field == Tile.Obstacle ? 1 : 0])
            else obstacle_map[y].push(field == Tile.Obstacle ? 0 : 1)
            update_able_map.push({ x: x, y: y, weight: isOre(field) ? vectorValues.ore : 0 })
        })
    })
    const obstacleGraph = new Graph(obstacle_map, { diagonal: true });
    const endNode = obstacleGraph.grid[start.y][start.x];

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

    while (final_path.length + (final_path.length < 1 ? 0 : Math.ceil(findNearestOre(final_path[final_path.length - 1].position.x, final_path[final_path.length - 1].position.y, update_able_map).distance)) + go_home.length < iterations && current_stack < max_stack) {
        current_stack++
        temp_final_path = final_path
        temp_go_home = go_home

        //súllyal vezérelt út
        let { my_path } = estimatePathWithWeight(obstacleGraph, update_able_map, final_path.length < 1 ? start : final_path[final_path.length - 1].position, endNode, iterations - final_path.length)
        my_path = [...final_path, ...my_path]

        //nézzük meg, hogy a kiszámolt út ugyanannyi ércet gyűjtött-e be, mint az előző számolásnál
        const current_ores = my_path.filter(i => i.action == "mine")
        const prev_ores = weight_based_path.filter(i => i.action == "mine")
        if(weight_based_path.length > 0)weight_based_path[0].action = "move2"
        if (current_ores.length == prev_ores.length && final_path[0].action != "move2"){
            break
        };
        
        weight_based_path = my_path
        
        
        //salesman probléma megoldásának próbálkozása — use adaptive coeff scaled to ore count
        const { ordered_path } = salesmanSolver(current_ores.map(i => i.position),obstacleGraph, start)
        if(ordered_path.length < my_path.length){
            final_path = ordered_path
        }else if(final_path.length > 0 && final_path[0].action == "move2"){
            final_path = deepCopy(final_path)
            final_path[0].action ="move"
        }else{
            final_path = my_path
        }
        const column: Position = ordered_path[ordered_path.length - 1].position
        const startNode = obstacleGraph.grid[column.y][column.x];
        const astarpath = astar.search(obstacleGraph, startNode, endNode);
        go_home = astarpath.map(tile => { return { action: "move", position: { x: tile.y, y: tile.x } } })
        
        
    }
    //ha az algoritmus lefutott több, mint egyszer, és az utolsó nem volt megfelelő, akkor cseréljük ki
    if (temp_final_path.length != 0 && final_path.length + go_home.length > iterations) {
        final_path = temp_final_path
        go_home = temp_go_home
    } else if (temp_final_path.length == 0 && final_path.length + go_home.length > iterations) {
        final_path = weight_based_path
    }
    final_path = [...final_path, ...go_home]

    //állítsuk be a megtett utat
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
                mode: final_path[i].action == "move2" ? "move" : final_path[i].action as ("move" | "mine"),
                ore: (final_path[i].action == "mine" ? map[y][x] : undefined)
            }],
        })
    }

    //ha maradt idő, akkor várjunk
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

/**
 * Salesman probléma megoldó: adjunk meg egy halom érc pozícióját, majd ez a funkció visszaad egy optimálisabb
 * sorrendű utat, ami mindegyiket meglátogatta kezdve a `start` ponttól, A* algoritmust használva minden
 * megálló között. `mine_positions` határozza meg a Salesman algoritmus pontosságát, több érc = több iteráció.
 * @param {Position[]} mine_positions az ércek pozíciói
 * @param {Graph} obstacleGraph a 2d-s gráf az akadályokból
 * @param {Position} start a start pozíció
 * @returns {Action[]} `ordered_path` az ércek optimálisabb bejárási útja
 */
function salesmanSolver(
    mine_positions: Position[],
    obstacleGraph:any,
    start: Position,
    seconds?:number
): { ordered_path: Action[] } {
    // Adaptive coefficient: scales SA work to problem size badly with the use of AI (thx) instead of running
    // a fixed 184 million iterations regardless of how many ores there are.
    const solution = solve(mine_positions, 1, undefined, undefined, true,seconds);
    const ordered_points = solution.map((i: number) => mine_positions[i]);
    const ordered_path: Action[] = []
    let current = start
    
    for (let i = 0; i < ordered_points.length; i++) {
        const target = ordered_points[i]
        const steps = getNextStep(current.x, current.y, target.x, target.y,obstacleGraph,true)
        for (let i =0;i<steps.entire_path!.length;i++) {
            ordered_path.push({ action: "move", position: steps.entire_path![i] })
        }
        current = steps.entire_path![steps.entire_path!.length - 1]
        ordered_path.push({ action: "mine", position: current })
    }
    return { ordered_path }
}

/**
 * Súlyokkal becsli meg az utat, a `start` ponttól indulva az `end` pont felé.
 * Visszaad egy listát egy mozgás/bányászás akciókkal teli útról, használható 
 * bemeneti értékű útnak a `salesmanSolver` algoritmusnak
 * @param {Graph} obstacleGraph a 2d-s gráf akadályokkal
 * @param {WeightPoint[]} update_able_map a térkép ércekkel
 * @param {Position} start az a pont, ahonnan kezdjük az utat
 * @param {any} endNode az a pont, ahová vissza kell érjünk
 * @param {number} iterations a maximálisan eltölthető idő
 * @returns {Action[]} `my_path` a kiszámolt út
 */
function estimatePathWithWeight(
    obstacleGraph:any,
    update_able_map: WeightPoint[],
    start: Position,
    endNode: any,
    iterations: number
): { my_path: Action[] } {
    const my_path: Action[] = []
    let column = calculateTile(update_able_map, start.x, start.y)
    let we_are_stuck = false;

    while (isThereAWay(column) && my_path.length < iterations) {
        let next_column = calculateTile(update_able_map, column.x + column.endPoint.relative_x, column.y + column.endPoint.relative_y)

        if (we_are_stuck || isStuck(column,next_column,my_path)) {
            const { next_column_to_go } = stuck(column, update_able_map,obstacleGraph)
            column = calculateTile(update_able_map, next_column_to_go.x, next_column_to_go.y)

            my_path.push({ action: "move", position: { x: column.x, y: column.y } })
            const tile_id_temp = update_able_map.findIndex(tile => tile.y == column.y && tile.x == column.x)
            const tile_id = update_able_map[tile_id_temp].weight != 0 ? tile_id_temp : null
            if (tile_id !== null) {
                we_are_stuck = false
                update_able_map[tile_id].weight = 0
                my_path.push({ action: "mine", position: { x: column.x, y: column.y } })
            }

            const startNode = obstacleGraph.grid[column.y][column.x];
            const astarpath = astar.search(obstacleGraph, startNode, endNode);

            //vissza kell-e mennünk?
            if((my_path.length + astarpath.length) >= iterations - 1) break;
            continue
        }
        

        if (obstacleGraph.grid[next_column.y][next_column.x].weight === 0) {
            const step = getNextStep(column.x, column.y, next_column.x + next_column.endPoint.relative_x, next_column.y + next_column.endPoint.relative_y,obstacleGraph)
            next_column = calculateTile(update_able_map, column.x + step.dx, column.y + step.dy)
        }

        column = next_column
        my_path.push({ action: "move", position: { x: column.x, y: column.y } })

        const tile_id_temp = update_able_map.findIndex(tile => tile.y == column.y && tile.x == column.x)
        const tile_id = update_able_map[tile_id_temp].weight != 0 ? tile_id_temp : null
        if (tile_id !== null) {
            update_able_map[tile_id].weight = 0
            my_path.push({ action: "mine", position: { x: column.x, y: column.y } })
        }

        const startNode = obstacleGraph.grid[column.y][column.x];
        const astarpath = astar.search(obstacleGraph, startNode, endNode);

        //vissza kell-e mennünk?
        if((my_path.length + astarpath.length) >= iterations - 1) break;
    }

    return { my_path }
}