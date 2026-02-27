import { useCycle, useSnapshots } from "@/lib/contexts"
import { Field } from "@/types/MapTypes";
import { makePath } from "@/util/algorithm";
import { Tile, isOre } from "@/util/constants";
import { readMap } from "@/util/map";
import { VectorField } from "@/util/constants";
import { useState, useEffect, useMemo } from "react";

export const Renderer = () => {
    const { currentTick } = useCycle();
    const map = useSnapshots().snapshots.get(currentTick)?.fields;
    const map2DTiles: Tile[][] = useMemo(() => {
        const map2D: Tile[][] = [];
        for (const field of map!) {
            const { x, y } = field.position;

            if (!map2D[y]) {
                map2D[y] = [];
            }

            map2D[y][x] = field.tile;
        }
        return map2D;
    }, [map])

    useEffect(()=>{
      console.log("changed")
    },[map2DTiles])
    
    return <div className="w-full h-full flex flex-col items-center justify-center py-100 ">
          <table className="mx-auto">
            <thead>
              <tr>
                <th></th>
                {map2DTiles.map((row:Tile[],id:number)=>{
                  return <th key={id} className="text-xs">{id}</th>
                })}
              </tr>
            </thead>
            <tbody>
              {map2DTiles.map((row:Tile[],id:number)=>{
                return <tr key={id}>
                  <td><p>{id}</p></td>
                  {row.map((tile,idx)=>{
                    return <td aria-valuemin={idx} aria-valuemax={id} className={`w-5 border border-collapse ${tile == Tile.Start ? "bg-yellow-700" : (tile == Tile.Empty ? "bg-gray-900" : "")}`} key={idx}>

                      <p className="w-full h-min text-center aspect-square">{tile == Tile.Obstacle ? "🟥" : (isOre(tile) ? "❤" : (tile == Tile.Start ? "🏳️" : ""))}</p>
                      
                    </td>
                  })}
                </tr>
              })}
            </tbody>
          </table>
    </div>
}