// Térkép: 50×50 blokk
// . = átjárható marsi felszín
// # = akadály (szürke kő)
// B = kék ásvány (vízjég)
// Y = sárga ásvány (ritka arany)
// G = zöld ásvány (ritka ásvány)
// S = a rover kiindulópontja

import { Rover, time } from "./constants";


export async function makePath(map:string[][]) {
    const rover = new Rover()
    let reachable_tiles = 0
    let current_time = 0
    let day = 0
    while (rover.power.current >= rover.energy_moving()){
        rover.power.current -= rover.energy_moving()
        reachable_tiles += rover.speed
        if(current_time <= 16){
            rover.power.current += rover.daylight_powering
        }else if(current_time == 24){
            current_time = 0
            day += 1
        }
        current_time += 0.5
    }
    const starting_row = map.findIndex((tile)=>tile.includes("S"))
    const start = {
        x:starting_row,
        y:map[starting_row].findIndex((tile:string)=>tile == "S")
    }
    /*

        ---------------                       
       |  x            |           
       |            x  |        
       |       S       |         
       |               |
       |    x          |       
        ---------------                         
    */

    console.log(map,start,current_time,day,reachable_tiles)
    return {map,start,current_time,day,reachable_tiles}
}