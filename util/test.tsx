import { mapConstraints } from "./constants";

//TESTING ONLY
export function generateMap(): string[][] {
  const mapArray: string[][] = [];
  let startingPointSet = false
  for (let i = 0; i < mapConstraints.height; i++) {
    const row = [];
    for (let j = 0; j < mapConstraints.width; j++) {
        const rand = Math.random();
      
        const rand2 = Math.random();
        if ((rand2 < 0.0005 && !startingPointSet) || (i == mapConstraints.height - 1 && j == mapConstraints.width - 1 && !startingPointSet)) {
            startingPointSet = true
            row.push("S"); // Rover starting point
        } else if (rand < 0.70) {
            row.push("."); // Passable terrain
        } else if (rand < 0.85) {
            row.push("#"); // Obstacles
        } else if (rand < 0.90) {
            row.push("B"); // Blue mineral
        } else if (rand < 0.95) {
            row.push("Y"); // Yellow mineral
        } else {
            row.push("G"); // Green mineral
        }
    }
    mapArray.push(row);
  }
  
  return mapArray;
}
//TESTING ONLY

