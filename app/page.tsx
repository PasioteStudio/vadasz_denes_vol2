"use client"
import { makePath } from "@/util/algorithm";
import { generateMap, readMap } from "@/util/map";
import { useEffect, useState } from "react";
import { isOre, Tile} from "@/util/constants"
import { VectorField } from "@/util/constants";

export default function Home() {
  const [map,setMap] = useState<Tile[][]>([])
  const [path,setPath] = useState<number[]>([])
  const [time,setTime] = useState<number>(0) //ms
  useEffect(()=>{
    const fetchMap = async()=>{
      //const map = generateMap()
      const map = await readMap("/mars_map_50x50.csv")
      setMap(map)
    }
    fetchMap()
  },[])
  useEffect(()=>{
    if(!map || map.length < 1)return
    const start_time = new Date()
    makePath(map,200 * 10)
    const end_time = new Date()
    setTime(end_time.getTime()-start_time.getTime())
  },[map])
  useEffect(()=>{
    /*console.log("ores:",ore_count)
    console.log("path:",my_path)
    setPath(my_path.map(node=>{
      return node.y * map.length + node.x 
    }))*/
  },[])
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full mx-auto flex-col items-center justify-between py-32 px-8 bg-white dark:bg-black sm:items-start">
          <div className="mx-auto flex gap-4 items-center mb-5">
            <h1 className="text-4xl">{time == 0 ? "Calculating..." : "Time:"}</h1>
            {time != 0 ? <h2 className="text-2xl">{time}ms (Path length: {path.length})</h2> : null}
          </div>
          <table className="mx-auto">
            <thead>
              <tr>
                <th></th>
                {map.map((row:Tile[],id:number)=>{
                  return <th key={id} className="text-xs">{id}</th>
                })}
              </tr>
            </thead>
            <tbody>
              { path && map.map((row:Tile[],id:number)=>{
                return <tr key={id}>
                  <td><p>{id}</p></td>
                  {row.map((tile,idx)=>{
                    return <td aria-valuemin={idx} aria-valuemax={id} className={`w-5 border border-collapse ${tile == Tile.Start ? "bg-yellow-700" : (path.includes(id * map.length + idx)) ? "bg-red-900" : (tile == Tile.Empty ? "bg-gray-900" : "")}`} key={idx}>
                      <p className="w-full h-min text-center aspect-square">{tile == Tile.Obstacle ? "🟥" : (isOre(tile) ? "❤" : (tile == Tile.Start ? "🏳️" : ""))}</p>
                    </td>
                  })}
                </tr>
              })}
            </tbody>
          </table>
      </main>
    </div>
  );
}
