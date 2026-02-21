// Térkép: 50×50 blokk
// . = átjárható marsi felszín
// # = akadály (szürke kő)
// B = kék ásvány (vízjég)
// Y = sárga ásvány (ritka arany)
// G = zöld ásvány (ritka ásvány)
// S = a rover kiindulópontja
const iteraions = 100
import { Rover, time,ores, vectorValues } from "@/util/constants";
import {Graph,astar} from "@/util/astar"
import {createVectorMapFromWeights, VectorField, WeightPoint} from "@/util/vectormap"
import {findNearestOre, getNextStep} from "@/util/oresearch"

function stuck(
    column:{x:number,y:number},
    update_able_map:WeightPoint[],
    obstacle_map:(0|1)[][]
):{stillStuck:boolean,next_column_to_go:{x:number,y:number}}{
    const nearestOre = findNearestOre(column.x, column.y, update_able_map)
    const step = getNextStep(column.x, column.y, nearestOre.x, nearestOre.y,obstacle_map)
    if(step.dx ==0 && step.dy == 0){
        //standing on one
        return {stillStuck:false,next_column_to_go:column}
    }
    return {stillStuck:true,next_column_to_go:{x:column.x + step.dx,y:column.y + step.dy}}
}

export function makePath(map:string[][]) {
    //Initialize maps
    const vector_map = createVectorMapFromWeights(map.length,map[0].length,map.flatMap((rows,idx)=>{
        return rows.map((tile,id)=>{
            return {x:id,y:idx ,weight:ores.includes(tile) ? 1 : 0}
        })
    }))
    
    const starting_row = map.findIndex((tile)=>tile.includes("S"))
    const start = {
        x:map[starting_row].findIndex((tile:string)=>tile == "S"),
        y:starting_row
    }
    //METHOD 1: Search for a destination?
    //
    //TODO WARNING - CAUTION - Astar's Graph somehow messes up and the nodes' x and y are swapped! (if i remember correctly)
    //const graphWithWeight = new Graph(map.map(rows=>{
    //    return rows.map(tile=>tile == "#" ? 0 : 1)
    //}),{diagonal:true});
    //const startWithWeight = graphWithWeight.grid[start.y][start.x];
    //const endWithWeight = graphWithWeight.grid[vector_map[start.y][start.x].endPoint.y][vector_map[start.y][start.x].endPoint.x];
    //const resultWithWeight = astar.search(graphWithWeight, startWithWeight, endWithWeight);
    //resultWithWeight is an array containing the shortest path taking into account the weight of a node
    
    const rover = new Rover()
    
    //METHOD 2: go with the flow ~
    const my_path = []
    let column = vector_map[start.y][start.x]
    const obstacle_map = map.map((row)=>{
        return row.map(tile=>{
            return tile == "#" ? 1 : 0 
        })
    })
    let update_able_map = map.flatMap((rows,idx)=>{
        return rows.map((tile,id)=>{
            return {x:id,y:idx ,weight:ores.includes(tile) ? vectorValues.ore : (tile == "#") ? 0 : 0}
        })
    })
    let update_able_vector_map:VectorField[][] = vector_map
    let number = 0
    let we_are_stuck = false;
    while((column.endPoint.relative_x != 0 || column.endPoint.relative_y != 0) && number < iteraions){
        number++
        let next_column = update_able_vector_map[column.y + column.endPoint.relative_y][column.x + column.endPoint.relative_x]
        //not 100% that it's gonna be the next column (but we assume)
        
        //check if we stuck
        if(we_are_stuck || my_path.slice(-4).filter(tile=>tile.x == (next_column.x && tile.y == next_column.y) || (column.x && tile.y == column.y)).length > 1){
            //we stuck -> search for the nearest ore
            const {stillStuck,next_column_to_go} = stuck(column,update_able_map,obstacle_map)
            we_are_stuck=stillStuck
            if(stillStuck){
                column = update_able_vector_map[next_column_to_go.y][next_column_to_go.x]
                my_path.push({x: column.x, y: column.y})
                continue
            }else{
                //found an ore
                update_able_vector_map = extractOre(column,update_able_map,update_able_vector_map)
                next_column = update_able_vector_map[column.y + column.endPoint.relative_y][column.x + column.endPoint.relative_x]
            }
        }
        //if the next_column is an obstacle, move around it
        if(obstacle_map[next_column.y][next_column.x] == 1){
            //the goal point is where the obstacle points to
            const step = getNextStep(column.x, column.y, next_column.x + next_column.endPoint.relative_x, next_column.y + next_column.endPoint.relative_y,obstacle_map)
            //console.log("obstacle!",step,column.x, column.y, next_column.x + next_column.endPoint.relative_x, next_column.y + next_column.endPoint.relative_y,)
            next_column = update_able_vector_map[column.y + step.dy][column.x + step.dx]
        }

        //record the moving
        column = next_column
        my_path.push({x:column.x,y:column.y})
                
        //update the map if ore found
        if(update_able_map[update_able_map.findIndex(tile=>tile.y == column.y && tile.x == column.x)].weight == 0) continue
        update_able_vector_map = extractOre(column,update_able_map,update_able_vector_map)
    }

    return {my_path,final_vector_map:update_able_vector_map,initial_vector_map:vector_map}
}
function extractOre(column:{x:number,y:number}, update_able_map:WeightPoint[],update_able_vector_map:VectorField[][])
:VectorField[][]{
    update_able_map[update_able_map.findIndex(tile=>tile.y == column.y && tile.x == column.x)].weight = 0
    return createVectorMapFromWeights(update_able_vector_map.length,update_able_vector_map[0].length,update_able_map)
}
