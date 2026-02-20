// Térkép: 50×50 blokk
// . = átjárható marsi felszín
// # = akadály (szürke kő)
// B = kék ásvány (vízjég)
// Y = sárga ásvány (ritka arany)
// G = zöld ásvány (ritka ásvány)
// S = a rover kiindulópontja

import { Rover, time,ores } from "@/util/constants";
import {Graph,astar} from "@/util/astar"
import {createVectorMapFromWeights} from "@/util/vectormap"
import {findNearestOre, getNextStep} from "@/util/oresearch"



export function makePath(map:string[][]) {
    //Initialize maps
    const vector_map = createVectorMapFromWeights(map.length,map[0].length,map.flatMap((rows,idx)=>{
        return rows.map((tile,id)=>{
            return {x:id,y:idx ,weight:ores.includes(tile) ? 1 : 0}
        })
    }))
    const graphWithWeight = new Graph(map.map(rows=>{
        return rows.map(tile=>tile == "#" ? 0 : 1)
    }),{diagonal:true});
    const starting_row = map.findIndex((tile)=>tile.includes("S"))
    const start = {
        x:map[starting_row].findIndex((tile:string)=>tile == "S"),
        y:starting_row
    }
    const startWithWeight = graphWithWeight.grid[start.y][start.x];
    const endWithWeight = graphWithWeight.grid[vector_map[start.x][start.y].endPoint.y][vector_map[start.x][start.y].endPoint.x];
    const rover = new Rover()
    const resultWithWeight = astar.search(graphWithWeight, startWithWeight, endWithWeight);
    // resultWithWeight is an array containing the shortest path taking into account the weight of a node
    
    const my_path = []
    let column = vector_map[start.y][start.x]
    const obstacle_map = map.map((row)=>{
        return row.map(tile=>{
            return tile == "#" ? 1 : 0 
        })
    })
    let update_able_map = map.flatMap((rows,idx)=>{
        return rows.map((tile,id)=>{
            return {x:id,y:idx ,weight:ores.includes(tile) ? 1 : (tile == "#") ? 0 : 0}
        })
    })
    let update_able_vector_map = vector_map
    let number = 0
    let nearestOreToGo;
    console.log(vector_map)
    console.log("x:"+column.endPoint.relative_x,"y:"+column.endPoint.relative_y)
    while((column.endPoint.relative_x != 0 || column.endPoint.relative_y != 0) && number < 100){
        number++
        const next_column = update_able_vector_map[column.y + column.endPoint.relative_y][column.x + column.endPoint.relative_x]
        //check if we stuck
        /*if(nearestOreToGo || my_path.filter(tile=>tile.x == next_column.x && tile.y == next_column.y).length > 1){
            //we stuck -> search for the nearest ore
            //console.log("go out!")
            const nearestOre = findNearestOre(column.x, column.y, update_able_map)
            if(nearestOre) {
                nearestOreToGo = nearestOre
                const step = getNextStep(column.x, column.y, nearestOre.x, nearestOre.y,obstacle_map,map)
                const stuck_next_column = update_able_vector_map[column.y + step.dy][column.x + step.dx]
                if(stuck_next_column) {
                    column = stuck_next_column
                    my_path.push({x: column.x, y: column.y})
                    if(step.dx ==0 && step.dy == 0){
                        //standing on one
                        //console.log("got it!")
                        update_able_map[update_able_map.findIndex(tile=>tile.y == column.y && tile.x == column.x)].weight = 0
                        update_able_vector_map = createVectorMapFromWeights(map.length,map[0].length,update_able_map)
                        nearestOreToGo = null
                    }
                    continue
                }
            }
            break // No escape path found, exit loop
        }*/
        //console.log("went through!")
        //if the next_column is an obstacle, move around it
        /*if(obstacle_map[next_column.y][next_column.x] === 1) {
            // Next cell is blocked, find path around it
            const nearestOre = findNearestOre(column.x, column.y, update_able_map)
            if(nearestOre) {
                const step = getNextStep(column.x, column.y, nearestOre.x, nearestOre.y, obstacle_map, map)
                const around_column = update_able_vector_map[column.y + step.dy][column.x + step.dx]
                if(around_column && obstacle_map[around_column.y][around_column.x] === 0) {
                    column = around_column
                    my_path.push({x: column.x, y: column.y})
                    
                    if(step.dx === 0 && step.dy === 0) {
                        update_able_map[update_able_map.findIndex(tile=>tile.y == column.y && tile.x == column.x)].weight = 0
                        update_able_vector_map = createVectorMapFromWeights(map.length,map[0].length,update_able_map)
                    }
                    continue
                }
            }
            break // Can't get around obstacle
        }*/

        //record the moving
        column = next_column
        my_path.push({x:column.x,y:column.y})
        
        //console.log(update_able_map[update_able_map.findIndex(tile=>tile.y == column.y && tile.x == column.x)])
        
        //update the map if ore found
        if(update_able_map[update_able_map.findIndex(tile=>tile.y == column.y && tile.x == column.x)].weight == 0) continue
        update_able_map[update_able_map.findIndex(tile=>tile.y == column.y && tile.x == column.x)].weight = 0
        update_able_vector_map = createVectorMapFromWeights(map.length,map[0].length,update_able_map)
    }

    console.log(my_path)
    return {my_path,update_able_vector_map}
}