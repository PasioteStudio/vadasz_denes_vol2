// Térkép: 50×50 blokk
// . = átjárható marsi felszín
// # = akadály (szürke kő)
// B = kék ásvány (vízjég)
// Y = sárga ásvány (ritka arany)
// G = zöld ásvány (ritka ásvány)
// S = a rover kiindulópontja

// TODO iterations helyett time és tickek
import { isOre, vectorValues,Tile,VectorField, WeightPoint } from "@/util/constants";
import {Graph,astar} from "@/util/astar"
import {createVectorMapFromWeights} from "@/util/map"
import { getNextStep, isThereAWay, stuck, TookAnotherStep} from "@/util/path"
import { useSnapshots } from "@/lib/contexts";
import { Position } from "@/types/RoverContextTypes";
import { Dispatch, SetStateAction } from "react";
import { Field, MapSnapshot } from "@/types/MapTypes";


export function makePath(iterations:number,mapSnapShot:Field[][],snapshotsSetter:Dispatch<SetStateAction<Map<Number, MapSnapshot>>>) {
    //Initialize maps
    let start:Position = {x:0,y:0};
    let mapConstraints:{width:number,height:number} = {width:0,height:0};
    const obstacle_map:(0|1)[][] = []
    let update_able_map:WeightPoint[] = []
    mapSnapShot.forEach((row)=>{
        row.forEach((field)=>{
            //start
            if(field.tile == Tile.Start) start = field.position
            //constraints
            if(field.position.x + 1 > mapConstraints.width) mapConstraints.width = field.position.x + 1
            if(field.position.y + 1 > mapConstraints.height) mapConstraints.height = field.position.y + 1
            //obstacles
            if(obstacle_map.length < field.position.y + 1) obstacle_map.push([field.tile == Tile.Obstacle ? 1 : 0 ])
            else obstacle_map[field.position.y].push(field.tile == Tile.Obstacle ? 1 : 0 )
            //update_able_map
            update_able_map.push({x:field.position.x,y:field.position.y,weight:isOre(field.tile) ? vectorValues.ore : 0})
        })
    })
    
    let update_able_vector_map = createVectorMapFromWeights(mapConstraints.height,mapConstraints.width,{x:start.x,y:start.y}, update_able_map)
    
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
    
    //METHOD 2: go with the flow ~
    const my_path:Position[] = []
    let column = update_able_vector_map[start.y][start.x]
    let we_are_stuck = false;
    let have_to_go_back = false
    while((have_to_go_back || isThereAWay(column)) && my_path.length < iterations){
        if(have_to_go_back){
            const graphWithWeight = new Graph(obstacle_map.map((rows) => 
                rows.map((tile,idx) => tile === 1 ? 0 : 1)),  //if obstacle = 0 otherwise be 1 and the destination should be 1 aswell
                { diagonal: true });
            const startNode = graphWithWeight.grid[column.y][column.x];
            const endNode = graphWithWeight.grid[start.y][start.x];
            const astarpath = astar.search(graphWithWeight, startNode, endNode);
            if(astarpath.length < 1) break //we arrived
            column=update_able_vector_map[astarpath[0].x][astarpath[0].y]
            TookAnotherStep(mapSnapShot,iterations, obstacle_map,start,my_path,{x:column.x,y:column.y},update_able_map,update_able_vector_map,snapshotsSetter,null)
            //ore? we cant grab one ore because then we would be late
            continue
        }
        
        let next_column = update_able_vector_map[column.y + column.endPoint.relative_y][column.x + column.endPoint.relative_x]
        //not 100% that it's gonna be the next column (but we assume)
        //check if we're gonna be stuck
        if(we_are_stuck || my_path.slice(-2).filter(tile=>(tile.x == next_column.x && tile.y == next_column.y) || (column.x == tile.x && tile.y == column.y)).length > 0){
            //we stuck -> search for the nearest ore
            const {next_column_to_go} = stuck(column,update_able_map,obstacle_map)
            
            column = update_able_vector_map[next_column_to_go.y][next_column_to_go.x]
            
            //update the map if ore found
            const tile_id_temp = update_able_map.findIndex(tile=>tile.y == column.y && tile.x == column.x)
            const tile_id = update_able_map[tile_id_temp].weight != 0 ? tile_id_temp : null
            if(update_able_map[tile_id_temp].weight != 0){
                we_are_stuck=false
            }
            const step = TookAnotherStep(mapSnapShot,iterations, obstacle_map,start,my_path,{x:column.x,y:column.y},update_able_map,update_able_vector_map,snapshotsSetter,tile_id)
            update_able_vector_map = step.vector_map
            have_to_go_back = step.go_back
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
        
        //update the map if ore found
        const tile_id_temp = update_able_map.findIndex(tile=>tile.y == column.y && tile.x == column.x)
        const tile_id = update_able_map[tile_id_temp].weight != 0 ? tile_id_temp : null
        const step = TookAnotherStep(mapSnapShot,iterations,obstacle_map,start,my_path,{x:column.x,y:column.y},update_able_map,update_able_vector_map,snapshotsSetter,tile_id)
        update_able_vector_map = step.vector_map
        have_to_go_back = step.go_back
   
    }

    return {path:my_path}
}
