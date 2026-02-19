
// Térkép: 50×50 blokk
// . = átjárható marsi felszín
// # = akadály (szürke kő)
// B = kék ásvány (vízjég)
// Y = sárga ásvány (ritka arany)
// G = zöld ásvány (ritka ásvány)
// S = a rover kiindulópontja

import { Rover, time } from "./constants";

//TESTING ONLY
function generateMap(): string[] {
  const mapArray: string[] = [];
  let startingPointSet = false
  for (let i = 0; i < 50; i++) {
    let row = "";
    for (let j = 0; j < 50; j++) {
        const rand = Math.random();
      
        const rand2 = Math.random();
        if ((rand2 < 0.0005 && !startingPointSet) || (i == 49 && j == 49 && !startingPointSet)) {
            startingPointSet = true
            row += "S"; // Rover starting point
        } else if (rand < 0.70) {
            row += "."; // Passable terrain
        } else if (rand < 0.85) {
            row += "#"; // Obstacles
        } else if (rand < 0.90) {
            row += "B"; // Blue mineral
        } else if (rand < 0.95) {
            row += "Y"; // Yellow mineral
        } else {
            row += "G"; // Green mineral
        }
    }
    mapArray.push(row);
  }
  
  return mapArray;
}

const map = generateMap()
//TESTING ONLY


export async function makePath(map2:string[]) {
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
        y:map[starting_row].search("S")
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
}