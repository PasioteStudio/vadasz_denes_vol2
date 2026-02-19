"use client"
import { makePath } from "@/util/algorithm";
import { generateMap } from "@/util/test";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const [map,setMap] = useState<string[][]>([])
  useEffect(()=>{
    const fetchMap = async()=>{
      const result = await makePath(generateMap())
      setMap(result.map)
    }
    fetchMap()
  },[])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full mx-auto flex-col items-center justify-between py-32 px-8 bg-white dark:bg-black sm:items-start">
          <h1 className="text-4xl mx-auto">Coming Soon...</h1>
          <table className="mx-auto">
            <tbody>
              {map.map((row:string[],id:number)=>{
                return <tr key={id}>
                  {row.map((tile,idx)=>{
                    return <td className={`w-5 border border-collapse ${tile == "S" ? "bg-yellow-700" : (tile == "." ? "bg-gray-900" : "")}`} key={idx}>
                      <p className="w-full h-min text-center aspect-square">{tile}</p>
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
