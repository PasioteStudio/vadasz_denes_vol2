import { mapConstraints, Tile } from "./constants";

//TESTING ONLY
export function generateMap(): Tile[][] {
  const mapArray: Tile[][] = [];
  let startingPointSet = false
  for (let i = 0; i < mapConstraints.height; i++) {
    const row = [];
    for (let j = 0; j < mapConstraints.width; j++) {
        const rand = Math.random();
      
        const rand2 = Math.random();
        if ((rand2 < 0.0005 && !startingPointSet) || (i == mapConstraints.height - 1 && j == mapConstraints.width - 1 && !startingPointSet)) {
            startingPointSet = true
            row.push(Tile.Start); // Rover starting point
        } else if (rand < 0.70) {
            row.push(Tile.Empty); // Passable terrain
        } else if (rand < 0.85) {
            row.push(Tile.Obstacle); // Obstacles
        } else if (rand < 0.90) {
            row.push(Tile.Blue); // Blue mineral
        } else if (rand < 0.95) {
            row.push(Tile.Yellow); // Yellow mineral
        } else {
            row.push(Tile.Green); // Green mineral
        }
    }
    mapArray.push(row);
  }
  
  return mapArray;
}
//TESTING ONLY
const toTile = (char: string): Tile => {
    switch(char){
        case "B": return Tile.Blue;
        case "Y": return Tile.Yellow;
        case "G": return Tile.Green;
        case "#": return Tile.Obstacle;
        case "S": return Tile.Start;
        default: return Tile.Empty;
    }
}
export async function readMap(URL:string):Promise<Tile[][]>{
    let lines:string[] = [];
    await fetch(URL).then(res=>res.text()).then(async(data)=>{
        lines = data.split("\n").filter(line => line.trim() != "");
    })
    const map: Tile[][] = [];
    for(let i = 0; i<lines.length; i++){
        if(lines[i].trim() == "") continue;
        map.push([]);
        const currentRow = map[map.length - 1];
        lines[i].trim().split(',').forEach(t => currentRow.push(toTile(t)))
    }
    return map;
}