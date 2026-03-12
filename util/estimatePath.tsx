import { energy_moving, VectorField, WeightPoint } from "@/lib/constants";
import { getNextStep, isDay, isStuck, isThereAWay, stuck,isThereEnoughPower } from "./path";
import { Action } from "./algorithm";
import { calculateTile } from "./tile";
import { astar } from "@/lib/astar"
import { Position } from "@/types/RoverContextTypes";

/**
 * @description Súlyokkal vagy legközelebbi ércekkel (az az `greedy`) becsli meg az utat, a `start` ponttól indulva az `end` pont felé.
 * Visszaad egy listát egy mozgás/bányászás akciókkal teli útról, használható 
 * bemeneti értékű útnak a `salesmanSolver` algoritmusnak
 * @param {Graph} obstacleGraph a 2d-s gráf akadályokkal
 * @param {WeightPoint[]} update_able_map a térkép ércekkel
 * @param {Position} start az a pont, ahonnan kezdjük az utat
 * @param {any} endNode az a pont, ahová vissza kell érjünk
 * @param {number} iterations a maximálisan eltölthető idő
 * @param {number} power 
 * @param {boolean} withWeight súllyal becsüljön, vagy a legközelebbi érchez menjen
 * @returns {Action[]} `my_path` a kiszámolt út
 */
export function estimatePath(
    obstacleGraph:any,
    update_able_map: WeightPoint[],
    start: Position,
    endNode: any, //biztos, hogy nem akadály
    iterations: number,
    power:number,
    withWeight: boolean = false
): { path: Action[] } {
    const path: Action[] = []
    let current_tile = calculateTile(update_able_map, start.x, start.y)
    let rover_stuck = false;
    let go_back = false;

    while (isThereAWay(current_tile) && path.length < iterations) {
        if(go_back) break;
        if(!isThereEnoughPower(power,path.length,1,null)){
            path.push({ action: "wait", positions: [{ x: current_tile.x, y: current_tile.y }] })
            if(power > 0)power -= 1
            power += (isDay(path.length) ? 10 : 0)
            if(power > 100)power = 100
            continue
        }
        let next_tile_calculated:VectorField | null = null
        let next_tile:VectorField | null = null
        if(next_tile_calculated === null){
            next_tile  = calculateTile(update_able_map, current_tile.x + current_tile.endPoint.relative_x, current_tile.y + current_tile.endPoint.relative_y)
        }else{
            next_tile = next_tile_calculated
        }
        
        let once = true
        let tile_id = null
        let next_tile_id = null
        if (rover_stuck || isStuck(next_tile,withWeight ? path : [{action:"move",positions:[next_tile]}])) {
            let next_tile:VectorField | null = null
            let next_tile_to_go:Position | null = null
            while(tile_id === null){
                if(next_tile === null){
                    next_tile_to_go = stuck(current_tile, update_able_map,obstacleGraph).next_tile_to_go
                    current_tile = calculateTile(update_able_map, next_tile_to_go!.x, next_tile_to_go!.y)
                }else{
                    current_tile = next_tile
                }

                once ? path.push({ action: "move",positions: [{ x: current_tile.x, y: current_tile.y }] }) :  path[path.length - 1].positions.push({ x: current_tile.x, y: current_tile.y })
                once = false

                if(next_tile_id === null){
                    const tile_id_temp = update_able_map.findIndex(tile => tile.y == current_tile.y && tile.x == current_tile.x)
                    tile_id = update_able_map[tile_id_temp].weight != 0 ? tile_id_temp : null
                }else{
                    tile_id = next_tile_id
                }
                
                if (tile_id !== null) {
                    rover_stuck = false
                    update_able_map[tile_id].weight = 0
                    path.push({ action: "mine",positions: [{ x: current_tile.x, y: current_tile.y }] })
                    power -= 2
                }
                //Léphet-e még eggyet energia szerint?
                next_tile_to_go = stuck(current_tile, update_able_map,obstacleGraph).next_tile_to_go
                next_tile = calculateTile(update_able_map, next_tile_to_go.x, next_tile_to_go.y)

                const tile_id2_temp = update_able_map.findIndex(tile => tile.y == next_tile!.y && tile.x == next_tile!.x)
                next_tile_id = update_able_map[tile_id2_temp].weight != 0 ? tile_id2_temp : null
                
                //vissza kell-e mennünk?
                const startNode = obstacleGraph.grid[current_tile.y][current_tile.x];
                const astarpath = astar.search(obstacleGraph, startNode, endNode);

                if(path.length + astarpath.length >= iterations - 1){
                    go_back = true
                    break;
                }
                else if(isThereEnoughPower(power,path.length,path[path.length - 1].positions.length,next_tile_id) && path[path.length - 1].positions.length < 3) continue
                else break;
            }
            power -= energy_moving(path[path.length - (tile_id === null ? 1 : 2)].positions.length)
            power += isDay(path.length) ? (tile_id === null ? 10 : 20) : 0
            if(power > 100)power = 100
            continue
        }
        while(tile_id === null){
            if (obstacleGraph.grid[next_tile.y][next_tile.x].weight == 0) {
                const step = getNextStep(current_tile.x, current_tile.y, next_tile.x + next_tile.endPoint.relative_x, next_tile.y + next_tile.endPoint.relative_y,obstacleGraph)
                next_tile = calculateTile(update_able_map, current_tile.x + step.dx, current_tile.y + step.dy)
            }
            
            current_tile = next_tile
            
            once ? path.push({ action: "move",positions: [{ x: current_tile.x, y: current_tile.y }] }) :  path[path.length - 1].positions.push({ x: current_tile.x, y: current_tile.y })
            once = false
            
            if(next_tile_id === null){
                const tile_id_temp = update_able_map.findIndex(tile => tile.y == current_tile.y && tile.x == current_tile.x)
                tile_id = update_able_map[tile_id_temp].weight != 0 ? tile_id_temp : null
            }else{
                tile_id = next_tile_id
            }
            
            if (tile_id !== null) {
                update_able_map[tile_id].weight = 0
                path.push({ action: "mine",positions: [{ x: current_tile.x, y: current_tile.y }] })
            }
             //Léphet-e még eggyet energia szerint?
            next_tile = calculateTile(update_able_map, current_tile.x + current_tile.endPoint.relative_x, current_tile.y + current_tile.endPoint.relative_y)

            const tile_id2_temp = update_able_map.findIndex(tile => tile.y == next_tile!.y && tile.x == next_tile!.x)
            next_tile_id = update_able_map[tile_id2_temp].weight != 0 ? tile_id2_temp : null

            //vissza kell-e mennünk?
            const startNode = obstacleGraph.grid[current_tile.y][current_tile.x];
            const astarpath = astar.search(obstacleGraph, startNode, endNode);

            console.log("p",path.length,"a",astarpath.length)
            if((path.length + astarpath.length) >= iterations - 1){
                go_back = true
                break;
            }
            else if(isThereEnoughPower(power,path.length,path[path.length - 1].positions.length,next_tile_id) && path[path.length - 1].positions.length < 3) continue
            else break;
        }
        power -= energy_moving(path[path.length - (tile_id === null ? 1 : 2)].positions.length)
        power += isDay(path.length) ? (tile_id === null ? 10 : 20) : 0
        if(power > 100)power = 100
    }
    console.log("p2",path.length)

    return { path }
}