import { useCycle, useSnapshots } from "@/lib/contexts"
import { Field } from "@/types/MapTypes";
import { makePath } from "@/util/algorithm";
import { Tile, mapConstraints, ores } from "@/util/constants";
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

    const [vmap, setMap] = useState<Tile[][]>(map2DTiles)
    const [vector_map, setVectorMap] = useState<VectorField[][]>([])
    const [path, setPath] = useState<number[]>([])
    const [time, setTime] = useState<number>(0) //ms
    useEffect(() => {
        const fetchMap = async () => {
            //const map = generateMap()
            const map = await readMap("/mars_map_50x50.csv")
            setMap(map)
            setVectorMap(map.map(row => row.map(tile => { return { magnitude: 0, angleDeg360: 0 } as VectorField })))
        }
        fetchMap()
    }, [])
    useEffect(() => {
        if (!map || map.length < 1) return
        const start_time = new Date()
        const { ore_count, my_path, final_vector_map, initial_vector_map } = makePath(vmap,200)
        const end_time = new Date()
        console.log("initial_vector_map:", initial_vector_map)
        console.log("ores:", ore_count)
        console.log("path:", my_path)
        console.log("final_vector_map:", final_vector_map)
        setVectorMap(final_vector_map)
        setPath(my_path.map(node => {
            return node.y * mapConstraints.height + node.x
        }))
        setTime(end_time.getTime() - start_time.getTime())
    }, [vmap])


    return <div className="w-full h-full flex items-center justify-center py-100 ">
        <div className="mx-auto flex gap-4 items-center mb-5">
            <h1 className="text-4xl">{time == 0 ? "Calculating..." : "Time:"}</h1>
            {time != 0 ? <h2 className="text-2xl">{time}ms (Path length: {path.length})</h2> : null}
          </div>
          <table className="mx-auto">
            <thead>
              <tr>
                <th></th>
                {vmap.map((row:Tile[],id:number)=>{
                  return <th key={id} className="text-xs">{id}</th>
                })}
              </tr>
            </thead>
            <tbody>
              {vector_map && path && vmap.map((row:Tile[],id:number)=>{
                return <tr key={id}>
                  <td><p>{id}</p></td>
                  {row.map((tile,idx)=>{
                    return <td aria-valuemin={idx} aria-valuemax={id} className={`w-5 border border-collapse ${tile == Tile.Start ? "bg-yellow-700" : (path.includes(id * mapConstraints.height + idx)) ? "bg-red-900" : (tile == Tile.Empty ? "bg-gray-900" : "")}`} key={idx}>
                      {tile == Tile.Empty ? <p style={{fontSize:vector_map[id][idx].magnitude == 0 ? 0 : Math.min(vector_map[id][idx].magnitude * 7.5 + 6,12) + "px", rotate:"-"+vector_map[id][idx].angleDeg360+"deg"}}>
                        {`->`}
                      </p> : 
                      <p className="w-full h-min text-center aspect-square">{tile == Tile.Obstacle ? "🟥" : (ores.includes(tile) ? "❤" : (tile == Tile.Start ? "🏳️" : ""))}</p>
                      }
                    </td>
                  })}
                </tr>
              })}
            </tbody>
          </table>
    </div>
}