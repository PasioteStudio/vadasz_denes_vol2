"use client"
import { makePath } from "@/util/algorithm";
import { generateMap } from "@/util/test";
import Image from "next/image";
import { useEffect, useState } from "react";
import {mapConstraints, ores, Tile} from "@/util/constants"
import { VectorField } from "@/util/vectormap";
import { timeEnd } from "console";

export default function Home() {
  const [map,setMap] = useState<Tile[][]>([])
  const [vector_map,setVectorMap] = useState<VectorField[][]>([])
  const [path,setPath] = useState<number[]>([])
  const [time,setTime] = useState<number>(0) //ms
  useEffect(()=>{
    const fetchMap = async()=>{
      const map = generateMap()
      setMap(map)
      setVectorMap(map.map(row=>row.map(tile=>{return {magnitude:0,angleDeg360:0} as VectorField})))
    }
    fetchMap()
  },[])
  useEffect(()=>{
    if(!map || map.length < 1)return
    const start_time = new Date()
    const {my_path,final_vector_map,initial_vector_map} = makePath(map)
    const end_time = new Date()
    console.log("initial_vector_map:",initial_vector_map)
    console.log("path:",my_path)
    console.log("final_vector_map:",final_vector_map)
    setVectorMap(final_vector_map)
    setPath(my_path.map(node=>{
      return node.y * mapConstraints.height + node.x 
    }))
    setTime(end_time.getTime()-start_time.getTime())
  },[map])

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
              {vector_map && path && map.map((row:Tile[],id:number)=>{
                return <tr key={id}>
                  <td><p>{id}</p></td>
                  {row.map((tile,idx)=>{
                    return <td aria-valuemin={idx} aria-valuemax={id} className={`w-5 border border-collapse ${tile == Tile.Start ? "bg-yellow-700" : (path.includes(id * mapConstraints.height + idx)) ? "bg-red-900" : (tile == Tile.Empty ? "bg-gray-900" : "")}`} key={idx}>
                      {tile == Tile.Empty ? <p style={{fontSize:vector_map[id][idx].magnitude == 0 ? 0 : Math.min(vector_map[id][idx].magnitude * 7.5 + 6,12) + "px", rotate:"-"+vector_map[id][idx].angleDeg360+"deg"}}>
                        {`->`}
                      </p> : 
                      <p className="w-full h-min text-center aspect-square">{tile == Tile.Obstacle ? "🟥" : (ores.includes(tile) ? "✖️" : (tile == Tile.Start ? "🏳️" : ""))}</p>
                      }
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
