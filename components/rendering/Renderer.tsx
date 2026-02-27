import { useCycle, useSnapshots } from "@/lib/contexts"
import { Field } from "@/types/MapTypes";
import { Position } from "@/types/RoverContextTypes";
import { Tile, isOre } from "@/util/constants";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from 'three';


export const Renderer = () => {
    const { currentTick } = useCycle();
    const [path,setPath] = useState<number[]>([])
    const map = useSnapshots().snapshots.get(currentTick)?.fields;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // return <div className="w-full h-full flex flex-col items-center justify-center py-100 ">
    //       <table className="mx-auto">
    //         <thead>
    //           <tr>
    //             <th></th>
    //             {map!.map((row:Field[],id:number)=>{
    //               return <th key={id} className="text-xs">{id}</th>
    //             })}
    //           </tr>
    //         </thead>
    //         <tbody>
    //           {map!.map((row:Field[],id:number)=>{
    //             return <tr key={id}>
    //               <td><p>{id}</p></td>
    //               {row.map((field,idx)=>{
    //                 return <td aria-valuemin={idx} aria-valuemax={id} className={`w-5 border border-collapse ${field.tile == Tile.Start ? "bg-yellow-700" : (field.tile == Tile.Empty ? "bg-gray-900" : "")}`} key={idx}>

    //                   <p className="w-full h-min text-center aspect-square">{field.tile == Tile.Obstacle ? "🟥" : (isOre(field.tile) ? "❤" : (field.tile == Tile.Start ? "🏳️" : ""))}</p>
                      
    //                 </td>
    //               })}
    //             </tr>
    //           })}
    //         </tbody>
    //       </table>
    // </div>

    return <>
      <canvas ref={canvasRef}></canvas>
    </>
}