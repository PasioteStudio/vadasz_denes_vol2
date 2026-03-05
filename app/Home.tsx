"use client"
import { useEffect, useRef, useState } from "react";
import { CycleContext, DefaultRoverContextObject, MapTimeLineContext } from "@/lib/contexts";
import { CycleContextT } from "@/types/CycleContextTypes";
import { GUI } from "@/components/gui/GUI";
import { Renderer } from "@/components/rendering/Renderer";
import { Tile } from "@/util/constants";
import { makePath } from "@/util/algorithm";
import { deepCopy } from "@/util/path";
import { Delta } from "@/types/MapTimelineContextTypes";
import { Item, Log, Position, RoverT } from "@/types/RoverContextTypes";
import { processInventoryChanges, processLogChanges, processMapChanges, processPositionChanges } from "@/util/deltas";

export default function Home({ timeLimit, initialMap }: { timeLimit: number, initialMap: Tile[][] }) {
  const [cycle, setCycle] = useState<Omit<CycleContextT, "t" | "player" | "timeLimit">>({
    currentTick: 0,
    timeOfDay: "day",
    setTick: (t: number) => { setTickTo(t) },
    day: 16*2,
    night: 8*2,
    lastDirection: 1,
  });
  const [player, setPlayer] = useState({
    speed: 1 as 1 | 2 | -1 | -2,
    playing: "paused" as "paused" | "playing",
  });
  const t = useRef(0);
  const [map, setMap] = useState<Tile[][]>([]);
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [rover, setRover] = useState<RoverT>();

  const setTickTo = (t: number) => {
    // after we run the algorithm, we'll generate the snapshots there. now all we need is to load them when requested
    try {
      const actualTick = Math.max(0,Math.min(deltas.length-1, t));
      if(actualTick == cycle.currentTick) return;
      if(!(deltas[actualTick] ?? undefined)) throw Error;
      setCycle(p => {
        return {
          ...p,
          currentTick: actualTick,
          timeOfDay: t % 48 >= 32 ? "night" : "day",
          lastDirection: t < cycle.currentTick ? -1 : 1,
        }
      })
      recalculateSnapshots(actualTick);
    } catch {
      console.log("Gálati's gay") //TODO handle error or smth
    }
  };

  const recalculateSnapshots = (tTick: number) => {
    const cTick = cycle.currentTick;
    const direction = tTick < cTick ? -1 : 1;
    const deltasToExecute = direction == -1 ? 
        deltas.filter((d,i) => i <= cTick && i > tTick) // TODO check up on these lines, they may cause problems with the current relations
      : deltas.filter((d,i) => i > cTick && i <= tTick); // TODO
    
    let position: Position = {...rover!.position}
    let inventory: Item[] = {...rover!.inventory}
    let energy = rover!.energy;
    let logs: Log[] = [...rover!.logs];

    const newMap = [...map];

    deltasToExecute.forEach(d => {
      energy += d.energy * direction;
      processPositionChanges(position, d.moves, direction)
      processInventoryChanges(inventory, d.inventoryChanges, direction)
      processLogChanges(logs, d.logsAdded, direction)
      processMapChanges(newMap, d.moves, direction)
    })

    setRover(p => { return {
      ...p!,
      energy: energy,
      inventory: inventory,
      logs: logs,
      position: position,
    }})
    setMap(newMap)
  }

  useEffect(() => { //INIT: start the algorithm and create snapshots. for now. TODO: get input for stuff... maybe this should be on the main page instead of the layout... maybe everything should be moved..
    if(deltas.length > 0) return //dont run it twice
    const start = async () => {
        const start = new Date()
        const {path} = makePath(timeLimit,deepCopy(map),setDeltas);
        const end = new Date()
        console.log("time: ",end.getTime()-start.getTime())
        console.log("deltas: ", deltas)
        console.log("path:",path)
    }
    start()
  }, [initialMap])


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
      lastDirection: cycle.lastDirection,
      t: t,
    }}>
      <MapTimeLineContext.Provider value={{
        deltas: deltas,
        map: map,
        rover: rover ?? DefaultRoverContextObject,
      }}>
        <Renderer /> {/* THIS WILL HAVE THE THREEJS CANVAS LATER ON */}
        <GUI />
      </MapTimeLineContext.Provider>
    </CycleContext.Provider>
  );
}
