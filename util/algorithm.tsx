// Térkép: 50×50 blokk
// . = átjárható marsi felszín
// # = akadály (szürke kő)
// B = kék ásvány (vízjég)
// Y = sárga ásvány (ritka arany)
// G = zöld ásvány (ritka ásvány)
// S = a rover kiindulópontja

// TODO iterations helyett time és tickek
const iterations = 200
import { Rover, time,ores, vectorValues,Tile, Point } from "@/util/constants";
import {Graph,astar} from "@/util/astar"
import {createVectorMapFromWeights, VectorField, WeightPoint} from "@/util/vectormap"
import {findNearestOre, getNextStep} from "@/util/oresearch"

function stuck(
    column:{x:number,y:number},
    update_able_map:WeightPoint[],
    obstacle_map:(0|1)[][]
):{next_column_to_go:{x:number,y:number}}{
    const nearestOre = findNearestOre(column.x, column.y, update_able_map)
    const step = getNextStep(column.x, column.y, nearestOre.x, nearestOre.y,obstacle_map)
    return {next_column_to_go:{x:column.x + step.dx,y:column.y + step.dy}}
}

export function makePath(map:Tile[][]) {
    //Initialize maps
    const starting_row = map.findIndex((row)=>row.includes(Tile.Start))
    const start = {
        x:map[starting_row].findIndex((tile:Tile)=>tile == Tile.Start),
        y:starting_row
    }

    const vector_map = createVectorMapFromWeights(map.length,map[0].length,{x:start.x,y:start.y}, map.flatMap((rows,idx)=>{
        return rows.map((tile,id)=>{
            return {x:id,y:idx ,weight:ores.includes(tile) ? 1 : 0}
        })
    }))
    
    
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
            return tile == Tile.Obstacle ? 1 : 0 
        })
    })
    let update_able_map = map.flatMap((rows,idx)=>{
        return rows.map((tile,id)=>{
            return {x:id,y:idx ,weight:ores.includes(tile) ? vectorValues.ore : (tile == Tile.Obstacle) ? 0 : 0}
        })
    })
    let update_able_vector_map:VectorField[][] = vector_map
    let number = 0
    let we_are_stuck = false;
    let ore_count = 0
    let have_to_go_back = false
    while((have_to_go_back || (column.endPoint.relative_x != 0 || column.endPoint.relative_y != 0)) && number < iterations){
        number++
        if(have_to_go_back){
            const graphWithWeight = new Graph(obstacle_map.map((rows,idy) => 
                rows.map((tile,idx) => tile === 1 ? (idy == start.y && idx == start.x ? 1 : 0) : 1)),  //if obstacle = 0 otherwise be 1 and the destination should be 1 aswell
                { diagonal: true });
            const startNode = graphWithWeight.grid[column.y][column.x];
            const endNode = graphWithWeight.grid[start.y][start.x];
            const astarpath = astar.search(graphWithWeight, startNode, endNode);
            console.log(astarpath.length)
            column=update_able_vector_map[astarpath[0].x][astarpath[0].y]
            my_path.push({x: column.x, y: column.y})

            //ore?
            const tile_id = update_able_map.findIndex(tile=>tile.y == column.y && tile.x == column.x)
            if(update_able_map[tile_id].weight == 0) continue
            ore_count++
            extractOre(tile_id,update_able_map,update_able_vector_map)
            continue
        }
        
        
        let next_column = update_able_vector_map[column.y + column.endPoint.relative_y][column.x + column.endPoint.relative_x]
        //not 100% that it's gonna be the next column (but we assume)
        //check if we're gonna be stuck
        if(we_are_stuck || my_path.slice(-2).filter(tile=>(tile.x == next_column.x && tile.y == next_column.y) || (column.x == tile.x && tile.y == column.y)).length > 0){
            //we stuck -> search for the nearest ore
            const {next_column_to_go} = stuck(column,update_able_map,obstacle_map)
            
            column = update_able_vector_map[next_column_to_go.y][next_column_to_go.x]
            //console.log(column.y*50+column.x)
            my_path.push({x: column.x, y: column.y,p:{next_column_to_go}})
            const {vector_map,go_back} = TakeAnotherStep(iterations, obstacle_map,start,my_path,{x:column.x,y:column.y},update_able_map,update_able_vector_map)
            update_able_vector_map = vector_map
            have_to_go_back = go_back
            
            //update the map if ore found
            const tile_id = update_able_map.findIndex(tile=>tile.y == column.y && tile.x == column.x)
            if(update_able_map[tile_id].weight != 0){
                we_are_stuck=false
                ore_count++
                extractOre(tile_id,update_able_map,update_able_vector_map)
            }
            continue
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
        //console.log(column.y*50+column.x)
        my_path.push({x:column.x,y:column.y})
        const {vector_map,go_back} = TakeAnotherStep(iterations,obstacle_map,start,my_path,{x:column.x,y:column.y},update_able_map,update_able_vector_map)
        update_able_vector_map = vector_map
        have_to_go_back = go_back

        //update the map if ore found
        const tile_id = update_able_map.findIndex(tile=>tile.y == column.y && tile.x == column.x)
        if(update_able_map[tile_id].weight == 0) continue
        ore_count++
        extractOre(tile_id,update_able_map,update_able_vector_map)
    }
    console.log(update_able_map)
    return {ore_count,my_path,final_vector_map:update_able_vector_map,initial_vector_map:vector_map}
}
function extractOre(tile_id:number, update_able_map:WeightPoint[],update_able_vector_map:VectorField[][])
//:VectorField[][]
{
    update_able_map[tile_id].weight = 0
    return 
}
function TakeAnotherStep(turnback_value:number,obstacle_map:(0|1)[][],start:Point,path:any[],point:Point, update_able_map:WeightPoint[],update_able_vector_map:VectorField[][])
:{vector_map:VectorField[][],go_back:boolean}
{
    const graphWithWeight = new Graph(obstacle_map.map((rows,idy) => 
        rows.map((tile,idx) => tile === 1 ? (idy == start.y && idx == start.x ? 1 : 0) : 1)),  //if obstacle = 0 otherwise be 1 and the destination should be 1 aswell
        { diagonal: true });
    const startNode = graphWithWeight.grid[point.y][point.x];
    const endNode = graphWithWeight.grid[start.y][start.x];
    const astarpath = astar.search(graphWithWeight, startNode, endNode);

    const vector_map = createVectorMapFromWeights(update_able_vector_map.length,update_able_vector_map[0].length,point,update_able_map)
    return {vector_map,go_back:(path.length + astarpath.length) >= turnback_value}
}