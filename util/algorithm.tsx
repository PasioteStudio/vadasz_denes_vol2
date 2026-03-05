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
import { getNextStep, isDay, isThereAWay, stuck, TookAnotherStep} from "@/util/path"
import { useSnapshots } from "@/lib/contexts";
import { Position } from "@/types/RoverContextTypes";
import { Dispatch, SetStateAction } from "react";
import { Field, MapSnapshot } from "@/types/MapTypes";
import { calculateTile } from "./tile";
import {solve} from "./salesman"
import { findNearestOre } from "./ore";


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
        
    //METHOD 1: Search for a destination?
    //
    //TODO WARNING - CAUTION - Astar's Graph somehow messes up and the nodes' x and y are swapped! (if i remember correctly)
    
    let final_path:{action:"move"|"mine",position:Position}[] = [];
    let go_home:{action:"move"|"mine",position:Position}[] = [];
    let temp_final_path:{action:"move"|"mine",position:Position}[] = [];
    let temp_go_home:{action:"move"|"mine",position:Position}[] = [];
    while(final_path.length + (final_path.length < 1 ? 0 : findNearestOre(final_path[final_path.length - 1].position.x,final_path[final_path.length - 1].position.y,update_able_map).distance) +  go_home.length < iterations){
        temp_final_path = final_path
        temp_go_home = go_home
        //METHOD 2: go with the flow ~
        let {my_path} = estimatePathWithWeight(mapSnapShot,obstacle_map,update_able_map,start,final_path.length < 1 ? start : final_path[final_path.length - 1].position,iterations - final_path.length)
        my_path = [...final_path,...my_path]
        
        //salesman
        const {ordered_path} = salesmanSolver(my_path,obstacle_map,start)
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
    
    //set all the values
    for(let i =0;i<final_path.length;i++){
        snapshotsSetter(prev=>{
        const previousSnap = prev.get(prev.size - 1)!
        const prevInventory = previousSnap.rover.inventory ?? []

        let found = false
        const newInventory = prevInventory.map(item => {
            if (item.ore === Tile.Yellow) {
            found = true
            return { ...item, amount: item.amount + 1 }
            }
            return item
        })

        if (!found) {
            newInventory.push({ ore: Tile.Yellow, amount: 1 })
        }
        prev.set(i+1,{
            ...previousSnap,
            fields: mapSnapShot, //TODO
            rover: {
            ...previousSnap!.rover,
            currentAction: {
                action: final_path[i].action,
            },
            energy: Math.min(previousSnap!.rover.energy - (final_path[i].action == "mine" ? 2 : 1) + (isDay(i) ? 10 : 0), 100),
            position: final_path[i].position,
            startingPosition: previousSnap!.rover.startingPosition,
            logs: [
                ...previousSnap!.rover.logs,
                {
                    message: `Állás itt: {TODO}`, //TODO
                }
                ],
            }
        })
        return prev
        })
    }
    
    //waiting
    for(let i = final_path.length;i< iterations;i++){
        final_path.push(final_path[i - 1])
        snapshotsSetter(prev=>{
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
            position: final_path[i - 1].position,
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
    return {path:final_path}
}
function salesmanSolver(my_path:{action:"move" | "mine",position:Position}[],obstacle_map:(0|1)[][],start:Position)
:{ordered_path:{action:"move" | "mine",position:Position}[]}
{
    const points = my_path.filter(tile=>tile.action == "mine").map(i=>i.position)
    const solution = solve(points,0.99999993,undefined,undefined,true);
    const ordered_points = solution.map(i => points[i]);
    const ordered_path:{action:"move" | "mine",position:Position}[] = []
    let ordered_column = start
    for(let i =0;i<ordered_points.length;i++){
        while(!(ordered_column.x == ordered_points[i].x && ordered_column.y == ordered_points[i].y)){
            const step = getNextStep(ordered_column.x, ordered_column.y,ordered_points[i].x ,ordered_points[i].y ,obstacle_map)
            ordered_column = {x:ordered_column.x + step.dx,y:ordered_column.y + step.dy}
            ordered_path.push({action:"move",position:ordered_column})
        }
        ordered_path.push({action:"mine",position:ordered_column})
    }
    return {ordered_path}
}
function estimatePathWithWeight(mapSnapShot:Field[][],obstacle_map:(0 | 1)[][],update_able_map:WeightPoint[],start:Position,end:Position,iterations:number)
:{my_path:{action:"mine"|"move",position:Position}[]}
{
    const my_path:{action:"mine"|"move",position:Position}[] = []
    let column = calculateTile(update_able_map,start.x,start.y)
    let we_are_stuck = false;
    let have_to_go_back = false
    while((have_to_go_back || isThereAWay(column)) && my_path.length < iterations){
        if(have_to_go_back){
            const graphWithWeight = new Graph(obstacle_map.map((rows) => 
                rows.map((tile,idx) => tile === 1 ? 0 : 1)),  //if obstacle = 0 otherwise be 1 and the destination should be 1 aswell
                { diagonal: true });
            const startNode = graphWithWeight.grid[column.y][column.x];
            const endNode = graphWithWeight.grid[end.y][end.x];
            const astarpath = astar.search(graphWithWeight, startNode, endNode);
            if(astarpath.length < 1) break
            column=calculateTile(update_able_map,astarpath[0].y /* x but stupidly */,astarpath[0].x /* y but stupidly */)
            TookAnotherStep(mapSnapShot,iterations, obstacle_map,end,my_path,{x:column.x,y:column.y},update_able_map,null)
            //ore? we cant grab one ore because then we would be late
            continue
        }
        
        let next_column = calculateTile(update_able_map,column.x + column.endPoint.relative_x,column.y + column.endPoint.relative_y)
        //not 100% that it's gonna be the next column (but we assume)
        //check if we're gonna be stuck
        if(we_are_stuck || my_path.slice(-2).filter(tile=>(tile.position.x == next_column.x && tile.position.y == next_column.y) || (column.x == tile.position.x && tile.position.y == column.y)).length > 0){
            //we stuck -> search for the nearest ore
            const {next_column_to_go} = stuck(column,update_able_map,obstacle_map)
            
            column = calculateTile(update_able_map,next_column_to_go.x,next_column_to_go.y)
            
            //update the map if ore found
            const tile_id_temp = update_able_map.findIndex(tile=>tile.y == column.y && tile.x == column.x)
            const tile_id = update_able_map[tile_id_temp].weight != 0 ? tile_id_temp : null
            if(update_able_map[tile_id_temp].weight != 0){
                we_are_stuck=false
            }
            const step = TookAnotherStep(mapSnapShot,iterations, obstacle_map,end,my_path,{x:column.x,y:column.y},update_able_map,tile_id)
            mapSnapShot = step.map
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
        const step = TookAnotherStep(mapSnapShot,iterations,obstacle_map,end,my_path,{x:column.x,y:column.y},update_able_map,tile_id)
        mapSnapShot = step.map
        have_to_go_back = step.go_back
   
    }
    return {my_path}
}