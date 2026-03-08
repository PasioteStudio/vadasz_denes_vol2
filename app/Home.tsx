"use client"
import { useCallback, useEffect, useRef, useState } from "react";
import { CycleContext, DefaultRoverContextObject, MapTimeLineContext } from "@/lib/contexts";
import { CycleContextT } from "@/types/CycleContextTypes";
import { GUI } from "@/components/gui/GUI";
import { Renderer } from "@/components/rendering/Renderer";
import { Tile } from "@/util/constants";
import { Delta, Move } from "@/types/MapTimelineContextTypes";
import { Item, Log, Position, RoverT } from "@/types/RoverContextTypes";
import { getEnergyForTick, processInventoryChanges, processLogChanges, processMapChanges, processPositionChanges } from "@/util/deltas";
import { generateFlavoredMap, getStartingPoint } from "@/util/map";
import { clamp } from "three/src/math/MathUtils.js";

export default function Home({ timeLimit, initialMap }: { timeLimit: number, initialMap: Tile[][] }) {
  const [cycle, setCycle] = useState<Omit<CycleContextT, "t" | "player" | "timeLimit" | "direction">>({
    currentTick: 0,
    timeOfDay: "day",
    setTick: (t: number) => { setTickTo(t) },
    day: 16 * 2,
    night: 8 * 2,
  });
  const cycleDirection = useRef<-1|1>(1);
  const [player, setPlayer] = useState({
    speed: 1 as 1 | 2 | -1 | -2,
    playing: "paused" as "paused" | "playing",
  });
  const t = useRef(0);
  const startingPoint = getStartingPoint(initialMap)
  const [map, setMap] = useState<Tile[][]>(initialMap);
  const flavoredMap = useRef<[boolean, Tile, Tile|null][][]>([])
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
        }
      })
      recalculateSnapshots(actualTick);
    } catch (e) {
      console.log("hiba") //TODO handle error or smth
    }
  }, [deltas, map, cycle.currentTick]);

  const recalculateSnapshots = useCallback((tTick: number) => {
    const cTick = cycle.currentTick;
    cycleDirection.current = tTick < cTick ? -1 : 1;
    const deltasToExecute = cycleDirection.current == -1 ?
      deltas.filter((d, i) => i <= cTick && i > tTick) 
      : deltas.filter((d, i) => i > cTick && i <= tTick);

    let position: Position = { ...rover!.position }
    let inventory: Item[] = [...rover!.inventory]
    let energy = rover!.energy;
    let logs: Log[] = [...rover!.logs];


    let newMap = flavoredMap.current.map(row => [...row]);

    deltasToExecute.forEach(d => {
      energy = getEnergyForTick(cTick, deltas);
      position = processPositionChanges(position, d.moves, cycleDirection.current)
      inventory = processInventoryChanges(inventory, d.inventoryChanges, cycleDirection.current)
      logs = processLogChanges(logs, d.logsAdded, cycleDirection.current)
      newMap = processMapChanges(newMap, d.moves, cycleDirection.current)
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
    flavoredMap.current = newMap;
  }, [deltas, rover])

  useEffect(() => {
    if (deltas.length > 1) return
    flavoredMap.current = generateFlavoredMap(map);
    setDeltas(prev=>{
      if(prev.length == 0){
        return [{
            energy: 0,
            inventoryChanges: [],
            logsAdded: [],
            moves: [{ from: {x:0,y:0}, to: {x:0,y:0}, mode: "wait" }]
        }]
      }
      return prev
    })
    const start = new Date()
    const worker = new Worker(new URL('@/util/algorithm.worker.ts', import.meta.url), { type: 'module' })
    console.log("here")
    worker.postMessage({
      type: "makePath",
      iterations:timeLimit,
      map:initialMap
    });
    console.log("here")
    worker.onmessage = (event) => {
      if (event.data.type === "makePathResult") {
        const end = new Date()
        console.log("time: ", end.getTime() - start.getTime())
        const path = event.data.result;
        console.log("deltas: ", path.deltas)
        console.log("path:", path.path)
        setDeltas(path.deltas);
      } else if (event.data.type === "error") {
        console.error("Worker error:", event.data.error);
      }
      worker.terminate();
    };
    console.log("here")
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
      direction: cycleDirection.current,
      t: t,
    }}>
      <MapTimeLineContext.Provider value={{
        deltas: deltas,
        map: map,
        rover: rover ?? DefaultRoverContextObject,
        startingPoint: startingPoint,
        flavoredMap: flavoredMap.current,
      }}>
        <Renderer />
        <GUI />
      </MapTimeLineContext.Provider>
    </CycleContext.Provider>
  );
}
