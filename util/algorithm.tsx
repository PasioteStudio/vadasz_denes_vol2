import { isOre, vectorValues, Tile, WeightPoint, energy_moving } from "@/lib/constants";
import { Graph, astar } from "@/lib/astar"
import { getNextStep, isDay, modified_astarpath } from "@/util/path"
import { Position } from "@/types/RoverContextTypes";
import { tileToString } from "./tile";
import { Delta, InventoryChange } from "@/types/MapTimelineContextTypes";
import { solve } from "../lib/salesman"
import { findNearestOre } from "./ore";
import { deepCopy } from "./path";
import { estimatePath } from "./estimatePath";

export enum TimeComplexity {
    FAST = 10.9,
    REGULAR = 10.9,
    SLOW = 10.9
}

export interface Action {
    action:"move"|"mine"|"move2"|"wait",
    positions:Position[]
}

const max_stack = 5
export function makePath(iterations: number, map: Tile[][], time_complexity: TimeComplexity = TimeComplexity.FAST,withWeight:boolean = false): { path: Position[][], deltas: Delta[] } {
    const deltas: Delta[] = [];

    let start: Position = { x: 0, y: 0 };
    const obstacle_map: (0 | 1)[][] = []
    const update_able_map: WeightPoint[] = []

    map.forEach((row, y) => {
        row.forEach((tile, x) => {
            if (tile == Tile.Start) start = { x: x, y: y }
            if (obstacle_map.length < y + 1) obstacle_map.push([tile == Tile.Obstacle ? 1 : 0])
            else obstacle_map[y].push(tile == Tile.Obstacle ? 0 : 1)
            update_able_map.push({ x: x, y: y, weight: isOre(tile) ? vectorValues.ore : 0 })
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
    let power = 100

    // LOCAL HELPERS
    function getlast<T>(arr:T[]): T {
        return arr[arr.length-1]
    }
    const getLastPosition = (arr: Action[]) => {
        const last = getlast(arr)
        return getlast(last.positions)
    }
    const getNearestOreDistance = () => {
        return Math.ceil(findNearestOre(getLastPosition(final_path).x, getLastPosition(final_path).y, update_able_map).distance)
    }
    const getHasTimeToReturn = ()=> {
        return final_path.length + (final_path.length < 1 ? 0 : getNearestOreDistance()) + go_home.length < iterations
    }

    // refactored while loop - pápus
    for(let current_stack = 0; current_stack < max_stack && getHasTimeToReturn(); current_stack++){
        temp_final_path = final_path
        temp_go_home = go_home

        //súllyal vezérelt út
        let { path } = estimatePath(obstacleGraph, update_able_map, 
            final_path.length < 1 ? start : getlast(final_path).positions[final_path[final_path.length - 1].positions.length - 1], 
            endNode, iterations - final_path.length,power,withWeight)
        path = [...final_path, ...path]

        //nézzük meg, hogy a kiszámolt út ugyanannyi ércet gyűjtött-e be, mint az előző számolásnál
        const current_ores = path.filter(i => i.action == "mine")
        const prev_ores = weight_based_path.filter(i => i.action == "mine")
        
        //nézzük meg, hogy ugyanannyi-e a két réc halmaz, és hogy ugyanaz-e, ha igen, akkor ne számoljunk tovább
        if(weight_based_path.length > 0)weight_based_path[0].action = "move2"
        if (current_ores.length == prev_ores.length && final_path.length > 0 && final_path[0].action != "move2"){
            break
        };
        
        weight_based_path = path
        
        //salesman probléma megoldásának próbálkozása
        const { ordered_path } = salesmanSolver(current_ores.map(i => i.positions[0]),obstacleGraph, start,time_complexity)
        //Ha jobb a kiszámolt út, akkor állítsuk be
        if(ordered_path.length < path.length){
            final_path = ordered_path
            //ha rosszabb, de még mindig több ércet vettünk fel, mint legutóbb,
            // akkor ne szakadjon meg a két érc halmaz megnézésekor
        }else if(final_path.length > 0 && final_path[0].action == "move2"){
            final_path = deepCopy(final_path)
            final_path[0].action ="move"
        }else{
            final_path = path
        }
        const tile: Position = getlast(ordered_path).positions[getlast(ordered_path).positions.length - 1]
        const startNode = obstacleGraph.grid[tile.y][tile.x];
        const astarpath = astar.search(obstacleGraph, startNode, endNode);
        go_home = modified_astarpath(power,ordered_path.length,astarpath,tile).modified_path
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
        const { x, y } = final_path[i].positions[final_path[i].positions.length - 1];
        deltas.push({
            energy: -(final_path[i].action == "mine" ?
                2 : (final_path[i].action == "wait" ? 
                    1 : energy_moving(final_path[i].positions.length))) + (isDay(i) ? 10 : 0),
            inventoryChanges: (final_path[i].action == "mine" ? [{
                amount: 1,
                mode: "add",
                ore: map[y][x],
            } as InventoryChange] : []),
            logsAdded: final_path[i].action == "mine" ? [{ message: `+1 ${tileToString(map[y][x])}` }] : final_path[i].positions.map(pos=>{return {message:`Mozgás ide: ${pos.x}, ${pos.y}`}}),
            moves: final_path[i].positions.map((pos,id)=>{return {
                from: id == 0 && i == 0 ? start : (id == 0 ? final_path[i - 1].positions[final_path[i - 1].positions.length - 1] : final_path[i].positions[id-1]),
                to: pos,
                mode: final_path[i].action == "move2" ? "move" : final_path[i].action as ("move" | "mine"),
                ore: (final_path[i].action == "mine" ? map[y][x] : undefined)
            }})
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
                from: final_path[i - 1].positions[final_path[i - 1].positions.length - 1],
                to: final_path[i - 1].positions[final_path[i - 1].positions.length - 1],
                mode: "wait",
            }],
        })
    }

    return { path: final_path.map(i => i.positions), deltas }
}

/**
 * @description Salesman probléma megoldó: adjunk meg egy halom érc pozícióját, majd ez a funkció visszaad egy optimálisabb
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
    seconds?:number,
    time_complexity?:TimeComplexity
): { ordered_path: Action[] } {
    let power = 100;

    const solution = solve(mine_positions, 1, undefined, undefined, true,seconds,time_complexity);
    const ordered_points = solution.map((i: number) => mine_positions[i]);
    const ordered_path: Action[] = []
    let current = start
    
    for (let i = 0; i < ordered_points.length; i++) {
        const target = ordered_points[i]
        const steps = getNextStep(current.x, current.y, target.x, target.y,obstacleGraph,true)
        const astar_path = modified_astarpath(power,ordered_path.length,steps.entire_path!,current)
        power = astar_path.power
        astar_path.modified_path.forEach(i=>{
            ordered_path.push(i)
        })
        current = steps.entire_path![steps.entire_path!.length - 1]
        while(power < 2){
            ordered_path.push({action: "wait", positions: [current] })
            if(power>0)power-=1
            power+=(isDay(ordered_path.length) ? 10 : 0)
            if(power > 100)power = 100
        }
        ordered_path.push({action: "mine", positions: [current] })
        power -= 2
        power += isDay(ordered_path.length) ? 10 : 0
        if(power > 100)power = 100
    }
    return { ordered_path }
}