"use client"
import { useEffect, useState } from "react";
import { CycleContext, MapSnapshotsContext, useSnapshots } from "@/lib/contexts";
import { CycleContextT } from "@/types/CycleContextTypes";
import { Field, MapSnapshot } from "@/types/MapTypes";
import { GUI } from "@/components/gui/GUI";
import { Renderer } from "@/components/rendering/Renderer";
import { Tile } from "@/util/constants";
import { makePath } from "@/util/algorithm";
import { readMap } from "@/util/map";

export default function Home({ timeLimit, initialMap }: { timeLimit: number, initialMap: Field[][] }) {
  const [time, setTime] = useState<number>(0) //ms
  const [mapSnapShots, setMapSnapshots] = useState<Map<Number, MapSnapshot>>(() =>
    new Map<Number, MapSnapshot>([ // this has to be overwritten by the algorithm
      [0, {
        fields: initialMap,
        rover: {
          currentAction: {
            action: "wait",
          },
          energy: 100,
          inventory: [],
          logs: [],
          position: initialMap.find(row => row.some(f => f.tile == Tile.Start))?.find(f => f.tile == Tile.Start)?.position ?? {x:0,y:0},
          startingPosition: initialMap.find(row => row.some(f => f.tile == Tile.Start))?.find(f => f.tile == Tile.Start)?.position ?? {x:0,y:0},
        }
      }],
    ]));

  const [cycle, setCycle] = useState<Omit<CycleContextT, "player" | "timeLimit">>({
    currentTick: 0,
    timeOfDay: "day",
    setTick: (t: number) => { setTickTo(t) },
    day: 16*2,
    night: 8*2
  });
  const [player, setPlayer] = useState({
    speed: 1 as 1 | 2,
    playing: "paused" as "paused" | "playing",
  });

  const setTickTo = (t: number) => {
    // after we run the algorithm, we'll generate the snapshots there. now all we need is to load them when requested
    try { //TODO check if snapshot for tick exists
      setCycle(p => {
        return {
          ...p,
          currentTick: t,
          timeOfDay: t % 48 > 32 ? "night" : "day"
        }
      })
    } catch {
      console.log("Gálati's gay") //TODO handle error or smth
    }
  };
  const loadSnapshot = (snapshot: MapSnapshot) => {

  }
  useEffect(() => { //INIT: start the algorithm and create snapshots. for now. TODO: get input for stuff... maybe this should be on the main page instead of the layout... maybe everything should be moved..
    const fetchMap = async () => {
        //const map = generateMap()
        const initialMap: Field[][] = (await readMap("/mars_map_50x50.csv"))
        console.log(initialMap)
        const newSnap = {
          fields: initialMap,
          rover: {
            currentAction: {
              action: "move" as ("move" | "wait" | "mine")
            },
            energy: 100,
            inventory: [],
            logs: [],
            position: initialMap.find(row => row.some(f => f.tile == Tile.Start))?.find(f => f.tile == Tile.Start)?.position ?? {x:0,y:0},
            startingPosition: initialMap.find(row => row.some(f => f.tile == Tile.Start))?.find(f => f.tile == Tile.Start)?.position ?? {x:0,y:0},
          }
        }
        setMapSnapshots(prev=>{
          prev.set(0,newSnap)
          return prev
        })
        const start = new Date()
        
        makePath(200,newSnap.fields,setMapSnapshots);
        const end = new Date()
        setTime(end.getTime()-start.getTime())
        console.log("time: ",end.getTime()-start.getTime())
        console.log("path length: ",mapSnapShots.size,mapSnapShots)
    }
    fetchMap()
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
      day: cycle.day,
      night: cycle.night,
      timeLimit: timeLimit
    }}>
      <MapSnapshotsContext.Provider value={{
        snapshots: mapSnapShots
      }}>
        <GUI />
        <Renderer /> {/* THIS WILL HAVE THE THREEJS CANVAS LATER ON */}
      </MapSnapshotsContext.Provider>
    </CycleContext.Provider>
  );
}
