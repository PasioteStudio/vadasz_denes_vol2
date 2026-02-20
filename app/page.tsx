"use client"
import { makePath } from "@/util/algorithm";
import { generateMap } from "@/util/test";
import Image from "next/image";
import { useEffect, useState } from "react";
import {mapConstraints, ores} from "@/util/constants"
import { VectorField } from "@/util/vectormap";

export default function Home() {
  const [map,setMap] = useState<string[][]>([])
  const [vector_map,setVectorMap] = useState<VectorField[][]>([])
  const [path,setPath] = useState<number[]>([])
  const [time,setTime] = useState<number>(0) //ms
  useEffect(()=>{
    const fetchMap = async()=>{
      const start_time = new Date()
      const map = generateMap()
      setMap(map)
      const {my_path,update_able_vector_map} = makePath(map)
      console.log(update_able_vector_map)
      setVectorMap(update_able_vector_map)
      setPath(my_path.map(node=>{
        return node.y * mapConstraints.height + node.x 
      }))
      const end_time = new Date()
      setTime(end_time.getTime()-start_time.getTime())
    }
    fetchMap()
  },[])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full mx-auto flex-col items-center justify-between py-32 px-8 bg-white dark:bg-black sm:items-start">
          <div className="mx-auto flex gap-4 items-center mb-5">
            <h1 className="text-4xl">Coming Soon...</h1>
            <h2 className="text-2xl">{time}ms</h2>
          </div>
          <table className="mx-auto">
            <thead>
              <tr>
                <th></th>
                {map.map((row:string[],id:number)=>{
                  return <th key={id} className="text-xs">{id}</th>
                })}
              </tr>
            </thead>
            <tbody>
              {vector_map && path && map.map((row:string[],id:number)=>{
                return <tr key={id}>
                  <td><p>{id}</p></td>
                  {row.map((tile,idx)=>{
                    return <td aria-valuemin={idx} aria-valuemax={id} className={`w-5 border border-collapse ${tile == "S" ? "bg-yellow-700" : (path.includes(id * mapConstraints.height + idx)) ? "bg-red-900" : (tile == "." ? "bg-gray-900" : "")}`} key={idx}>
                      {tile == "." ? <p style={{fontSize:Math.min(vector_map[id][idx].magnitude / 1.25 + 8,14) + "px", rotate:"-"+vector_map[id][idx].angleDeg360+"deg"}}>
                        {`->`}
                      </p> : 
                      <p className="w-full h-min text-center aspect-square">{tile == "#" ? "🟥" : (ores.includes(tile) ? "✖️" : (tile == "S" ? "🏳️" : ""))}</p>
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
