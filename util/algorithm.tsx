// Térkép: 50×50 blokk
// . = átjárható marsi felszín
// # = akadály (szürke kő)
// B = kék ásvány (vízjég)
// Y = sárga ásvány (ritka arany)
// G = zöld ásvány (ritka ásvány)
// S = a rover kiindulópontja

// TODO iterations helyett time és tickek
import { isOre, vectorValues,Tile, WeightPoint } from "@/util/constants";
import {Graph,astar} from "@/util/astar"
import { getNextStep, isDay, isThereAWay, stuck, TookAnotherStep} from "@/util/path"
import { Position } from "@/types/RoverContextTypes";
import { Dispatch, SetStateAction } from "react";
import { calculateTile } from "./tile";
import { Delta } from "@/types/MapTimelineContextTypes";


export function makePath(iterations:number,map: Tile[][],deltasSetter:Dispatch<SetStateAction<Delta[]>>) {
    //Initialize maps
    let start:Position = {x:0,y:0};
    let mapConstraints:{width:number,height:number} = {width:0,height:0};
    const obstacle_map:(0|1)[][] = []
    let update_able_map:WeightPoint[] = []
    map.forEach((row, y)=>{
        row.forEach((field, x)=>{
            //start
            if(field == Tile.Start) start = {x:x, y:y}
            //constraints
            if(x + 1 > mapConstraints.width) mapConstraints.width = x + 1
            if(y + 1 > mapConstraints.height) mapConstraints.height = y + 1
            //obstacles
            if(obstacle_map.length < y + 1) obstacle_map.push([field == Tile.Obstacle ? 1 : 0 ])
            else obstacle_map[y].push(field == Tile.Obstacle ? 1 : 0 )
            //update_able_map
            update_able_map.push({x:x,y:y,weight:isOre(field) ? vectorValues.ore : 0})
        })
    })
        
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
    let column = calculateTile(update_able_map,start.x,start.y)
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
            if(astarpath.length < 1) break
            column=calculateTile(update_able_map,astarpath[0].y /* x but stupidly */,astarpath[0].x /* y but stupidly */)
            TookAnotherStep(map,iterations, obstacle_map,start,my_path,{x:column.x,y:column.y},update_able_map,deltasSetter,null)
            //ore? we cant grab one ore because then we would be late
            continue
        }
        
        let next_column = calculateTile(update_able_map,column.x + column.endPoint.relative_x,column.y + column.endPoint.relative_y)
        //not 100% that it's gonna be the next column (but we assume)
        //check if we're gonna be stuck
        if(we_are_stuck || my_path.slice(-2).filter(tile=>(tile.x == next_column.x && tile.y == next_column.y) || (column.x == tile.x && tile.y == column.y)).length > 0){
            //we stuck -> search for the nearest ore
            const {next_column_to_go} = stuck(column,update_able_map,obstacle_map)
            
            column = calculateTile(update_able_map,next_column_to_go.x,next_column_to_go.y)
            
            //update the map if ore found
            const tile_id_temp = update_able_map.findIndex(tile=>tile.y == column.y && tile.x == column.x)
            const tile_id = update_able_map[tile_id_temp].weight != 0 ? tile_id_temp : null
            if(update_able_map[tile_id_temp].weight != 0){
                we_are_stuck=false
            }
            const step = TookAnotherStep(map,iterations, obstacle_map,start,my_path,{x:column.x,y:column.y},update_able_map,deltasSetter,tile_id)
            map = step.map
            have_to_go_back = step.go_back
            continue
        }
        //if the next_column is an obstacle, move around it
        if(obstacle_map[next_column.y][next_column.x] == 1){
            //the goal point is where the obstacle points to
            const step = getNextStep(column.x, column.y, next_column.x + next_column.endPoint.relative_x, next_column.y + next_column.endPoint.relative_y,obstacle_map)
            //console.log("obstacle!",step,column.x, column.y, next_column.x + next_column.endPoint.relative_x, next_column.y + next_column.endPoint.relative_y,)
            next_column = calculateTile(update_able_map,column.x + step.dx,column.y + step.dy)
        }

        //record the moving
        column = next_column
        
        //update the map if ore found
        const tile_id_temp = update_able_map.findIndex(tile=>tile.y == column.y && tile.x == column.x)
        const tile_id = update_able_map[tile_id_temp].weight != 0 ? tile_id_temp : null
        const step = TookAnotherStep(map,iterations,obstacle_map,start,my_path,{x:column.x,y:column.y},update_able_map,deltasSetter,tile_id)
        map = step.map
        have_to_go_back = step.go_back
   
    }
    for(let i = my_path.length;i< iterations;i++){
        my_path.push(my_path[i - 1])
        deltasSetter(prev=>{
        const previousSnap = prev.get(prev.size - 1)
        prev.set(i,{
            ...previousSnap,
            fields: mapSnapShot,
            rover: {
            ...previousSnap!.rover,
            currentAction: {
                action: "wait" as ("wait"),
            },
            energy: Math.min(previousSnap!.rover.energy - 1 + (isDay(i) ? 10 : 0), 100),
            position: my_path[i - 1],
            startingPosition: previousSnap!.rover.startingPosition,
            logs: [
                ...previousSnap!.rover.logs,
                {
                    message: `Állás itt: {TODO}`,
                }
                ],
            }
        })
        return prev
        })
    }
    return {path:my_path}
}
