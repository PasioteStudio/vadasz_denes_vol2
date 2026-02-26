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
import { Renderer } from "@/components/rendering/Renderer";

export default function Home({ timeLimit, initialMap }: { timeLimit: number, initialMap: Field[] }) {
  const [mapSnapShots, setMapSnapshots] = useState<Map<Number, MapSnapshot>>(() =>
    new Map<Number, MapSnapshot>([ // this has to be overwritten by the algo
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
        <Renderer /> {/* THIS WILL HAVE THE THREEJS CANVAS LATER ON */}
      </MapSnapshotsContext.Provider>
    </CycleContext.Provider>
  );
}
