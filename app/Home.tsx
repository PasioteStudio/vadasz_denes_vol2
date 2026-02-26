"use client"
import { makePath } from "@/util/algorithm";
import { generateMap, readMap } from "@/util/test";
import Image from "next/image";
import { useEffect, useState } from "react";
import { mapConstraints, ores, Tile } from "@/util/constants"
import { VectorField } from "@/util/vectormap";
import { timeEnd } from "console";
import { CycleContext, MapSnapshotsContext } from "@/lib/contexts";
import { CycleContextT } from "@/types/CycleContextTypes";
import { Field, MapSnapshot } from "@/types/MapTypes";
import { GUI } from "@/components/gui/GUI";
import { Position } from "@/types/RoverContextTypes";

export default function Home({ timeLimit, initialMap }: { timeLimit: number, initialMap: Field[] }) {



  // const [map, setMap] = useState<Tile[][]>([])
  // const [vector_map, setVectorMap] = useState<VectorField[][]>([])
  // const [path, setPath] = useState<number[]>([])
  // const [time, setTime] = useState<number>(0) //ms
  // useEffect(() => {
  //   const fetchMap = async () => {
  //     //const map = generateMap()
  //     const map = await readMap("/mars_map_50x50.csv")
  //     setMap(map)
  //     setVectorMap(map.map(row => row.map(tile => { return { magnitude: 0, angleDeg360: 0 } as VectorField })))
  //   }
  //   fetchMap()
  // }, [])
  // useEffect(() => {
  //   if (!map || map.length < 1) return
  //   const start_time = new Date()
  //   const { ore_count, my_path, final_vector_map, initial_vector_map } = makePath(map)
  //   const end_time = new Date()
  //   console.log("initial_vector_map:", initial_vector_map)
  //   console.log("ores:", ore_count)
  //   console.log("path:", my_path)
  //   console.log("final_vector_map:", final_vector_map)
  //   setVectorMap(final_vector_map)
  //   setPath(my_path.map(node => {
  //     return node.y * mapConstraints.height + node.x
  //   }))
  //   setTime(end_time.getTime() - start_time.getTime())
  // }, [map])
  const [mapSnapShots, setMapSnapshots] = useState<Map<Number, MapSnapshot>>(() =>
    new Map<Number, MapSnapshot>([
      [0, {
        fields: initialMap,
        rover: {
          currentAction: {
            action: "wait",
          },
          energy: 100,
          inventory: [],
          logs: [],
          position: initialMap.find(f => f.tile == Tile.Start)?.position ?? {x:0,y:0},
          startingPosition: initialMap.find(f => f.tile == Tile.Start)?.position ?? {x:0,y:0},
        }
      }],
    ]));

  const [cycle, setCycle] = useState<Omit<CycleContextT, "player" | "timeLimit">>({
    currentTick: 0,
    timeOfDay: "day",
    setTick: (t: number) => { setTickTo(t) },
  });
  const [player, setPlayer] = useState({
    speed: 1 as 1 | 2,
    playing: "paused" as "paused" | "playing",
  });

  const setTickTo = (t: number) => {
    // after we run the algo, we'll generate the snapshots there. now all we need is to load them when requested
    try { //TODO check if snapshot for tick exists
      setCycle(p => {
        return {
          ...p,
          currentTick: t,
          timeOfDay: t % 48 > 32 ? "night" : "day"
        }
      })
    } catch {
      console.log("fuck off, cunt") //TODO handle error or smthng
    }
  };
  const loadSnapshot = (snapshot: MapSnapshot) => {

  }
  useEffect(() => { //INIT: start the algorithm and create snapshots. for now. TODO: get input for stuff... maybe this should be on the main page instead of the layout... maybe everything should be moved..
    //startAlgorithm(snapshotsSetter:setMapSnapshots);
  }, [])


  return (
    <CycleContext.Provider value={{
      currentTick: cycle.currentTick,
      timeOfDay: cycle.timeOfDay,
      setTick: (t: number) => { cycle.setTick(t) },
      player: {
        playing: player.playing,
        speed: player.speed,
        setPlaying: (state) => { setPlayer(p => { return { ...p, playing: state } }) },
        setSpeed: (speed) => { setPlayer(p => { return { ...p, speed: speed } }) }
      },
      timeLimit: timeLimit
    }}>
      <MapSnapshotsContext.Provider value={{
        snapshots: mapSnapShots
      }}>
        <GUI />
        {/* 
          <Renderer />
        */}
      </MapSnapshotsContext.Provider>
    </CycleContext.Provider>
  );
}
