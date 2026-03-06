"use client"
import { useCallback, useEffect, useRef, useState } from "react";
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
import { getStartingPoint } from "@/util/map";
import { time } from "console";
import { clamp } from "three/src/math/MathUtils.js";

export default function Home({ timeLimit, initialMap }: { timeLimit: number, initialMap: Tile[][] }) {
  const [cycle, setCycle] = useState<Omit<CycleContextT, "t" | "player" | "timeLimit">>({
    currentTick: 0,
    timeOfDay: "day",
    setTick: (t: number) => { setTickTo(t) },
    day: 16 * 2,
    night: 8 * 2,
    lastDirection: 1,
  });
  const [player, setPlayer] = useState({
    speed: 1 as 1 | 2 | -1 | -2,
    playing: "paused" as "paused" | "playing",
  });
  const t = useRef(0);
  const startingPoint = getStartingPoint(initialMap)
  const [map, setMap] = useState<Tile[][]>(initialMap);
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [rover, setRover] = useState<RoverT>({
    energy: 100,
    inventory: [],
    logs: [],
    position: startingPoint,
    startingPosition: startingPoint,
  });

  const setTickTo = useCallback((t: number) => {
    try {
      const actualTick = Math.max(0, Math.min(deltas.length-1, t));
      if (actualTick == cycle.currentTick) return;
      if (!(deltas[actualTick] ?? undefined)) throw Error;
      setCycle(p => {
        return {
          ...p,
          currentTick: actualTick,
          timeOfDay: t % 48 >= 32 ? "night" : "day",
          lastDirection: t < cycle.currentTick ? -1 : 1,
        }
      })
      recalculateSnapshots(actualTick);
    } catch (e) {
      console.log("hiba") //TODO handle error or smth
    }
  }, [deltas, map]);

  const recalculateSnapshots = useCallback((tTick: number) => {
    const cTick = cycle.currentTick;
    const direction = tTick < cTick ? -1 : 1;
    const deltasToExecute = direction == -1 ?
      deltas.filter((d, i) => i <= cTick && i > tTick) 
      : deltas.filter((d, i) => i > cTick && i <= tTick);

    let position: Position = { ...rover!.position }
    let inventory: Item[] = [...rover!.inventory]
    let energy = rover!.energy;
    let logs: Log[] = [...rover!.logs];


    let newMap = map.map(row => [...row]);

    deltasToExecute.forEach(d => {
      energy += d.energy * direction; // TODO ez nem helyes így, mert ha pl 100-on volt nappal, akkor visszafelé levonja a nap töltését is.
      energy = clamp(energy, 0, 100);
      position = processPositionChanges(position, d.moves, direction)
      inventory = processInventoryChanges(inventory, d.inventoryChanges, direction)
      logs = processLogChanges(logs, d.logsAdded, direction)
      newMap = processMapChanges(newMap, d.moves, direction)
    })

    setRover(p => {
      return {
        ...p!,
        energy: energy,
        inventory: inventory,
        logs: logs,
        position: position,
      }
    })
    setMap(newMap)
  }, [deltas, rover])

  useEffect(() => {
    if (deltas.length > 0) return
    let isZero = false
    setDeltas(prev=>{
      if(prev.length == 0){
        isZero=true
        return [{
            energy: 0,
            inventoryChanges: [],
            logsAdded: [],
            moves: [{ from: {x:0,y:0}, to: {x:0,y:0}, mode: "wait" }]
        }]
      }
      return prev
    })
    if(!isZero) return
    const start = async()=>{
      const start = new Date()
      const path = makePath(timeLimit, deepCopy(initialMap));
      setDeltas(path.deltas);
      const end = new Date()
      console.log("time: ", end.getTime() - start.getTime())
      console.log("deltas: ", path.deltas)
      console.log("path:", path.path)
    }
    start()
  }, [initialMap])


  return (
    <CycleContext.Provider value={{
      currentTick: cycle.currentTick,
      timeOfDay: cycle.timeOfDay,
      setTick: (t: number) => { setTickTo(t) },
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
        startingPoint: startingPoint,
      }}>
        <Renderer />
        <GUI />
      </MapTimeLineContext.Provider>
    </CycleContext.Provider>
  );
}
