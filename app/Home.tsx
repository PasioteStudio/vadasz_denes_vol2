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
import { deepCopy } from "@/util/path";

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

  const [cycle, setCycle] = useState<Omit<CycleContextT, | "player" | "timeLimit" | "isInAnimation" | "setIsInAnimation">>({
    currentTick: 0,
    timeOfDay: "day",
    setTick: (t: number) => { setTickTo(t) },
    day: 16*2,
    night: 8*2,
    lastDirection: 1,
  });
  const [cycleInAnimation, setCycleInAnimation] = useState(false);
  const [player, setPlayer] = useState({
    speed: 1 as 1 | 2 | -1 | -2,
    playing: "paused" as "paused" | "playing",
  });

  const setTickTo = (t: number) => {
    // after we run the algorithm, we'll generate the snapshots there. now all we need is to load them when requested
    try {
      if(cycleInAnimation) return;
      const actualTick = Math.max(0,Math.min(mapSnapShots.size-1, t));
      if(!mapSnapShots.get(actualTick)) throw Error;
      setCycle(p => {
        return {
          ...p,
          currentTick: actualTick,
          timeOfDay: t % 48 >= 32 ? "night" : "day",
          lastDirection: t < cycle.currentTick ? -1 : 1,
        }
      })
    } catch {
      console.log("Gálati's gay") //TODO handle error or smth
    }
  };
  const loadSnapshot = (snapshot: MapSnapshot) => {

  }
  useEffect(() => { //INIT: start the algorithm and create snapshots. for now. TODO: get input for stuff... maybe this should be on the main page instead of the layout... maybe everything should be moved..
    if(mapSnapShots.size > 1) return //dont run it twice
    const start = async () => {
        const start = new Date()
        const {path} = makePath(timeLimit,deepCopy(mapSnapShots.get(0)!.fields),setMapSnapshots);
        const end = new Date()
        setTime(end.getTime()-start.getTime())
        console.log("time: ",end.getTime()-start.getTime())
        console.log("snapshots: ",mapSnapShots)
        console.log("path:",path)
    }
    start()
  }, [mapSnapShots])


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
      timeLimit: timeLimit,
      isInAnimation: cycleInAnimation,
      setIsInAnimation: (state: boolean) => {setCycleInAnimation(state)},
      lastDirection: cycle.lastDirection
    }}>
      <MapSnapshotsContext.Provider value={{
        snapshots: mapSnapShots
      }}>
        <Renderer /> {/* THIS WILL HAVE THE THREEJS CANVAS LATER ON */}
        <GUI />
      </MapSnapshotsContext.Provider>
    </CycleContext.Provider>
  );
}
