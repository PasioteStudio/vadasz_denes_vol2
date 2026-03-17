"use client"
import { useCallback, useEffect, useRef, useState } from "react";
import { CycleContext, DefaultRoverContextObject, MapTimeLineContext } from "@/lib/contexts";
import { CycleContextT } from "@/types/CycleContextTypes";
import { GUI } from "@/components/gui/GUI";
import { Renderer } from "@/components/rendering/Renderer";
import { Tile } from "@/lib/constants";
import { Delta, Move } from "@/types/MapTimelineContextTypes";
import { Item, Log, Position, RoverT } from "@/types/RoverContextTypes";
import { getEnergyForTick, processInventoryChanges, processLogChanges, processMapChanges, processPositionChanges } from "@/util/deltas";
import { generateFlavoredMap, getStartingPoint } from "@/util/map";
import { clamp } from "three/src/math/MathUtils.js";
import { deepCopy } from "@/util/path";
import LoadingScreen from "@/components/loading/LoadingScreen";
import { beamsolve } from "@/util/beamsearch";

export default function Home({ timeLimit, initialMap }: { timeLimit: number, initialMap: Tile[][] }) {
  const [cycle, setCycle] = useState<Omit<CycleContextT, "t" | "player" | "timeLimit" | "direction" | "setDirection">>({
    currentTick: 0,
    timeOfDay: "day",
    setTick: (t: number) => { setTickTo(t) },
    day: 16 * 2,
    night: 8 * 2,
  });
  const [cycleDirection, setCycleDirection] = useState<-1 | 1>(1);
  const [player, setPlayer] = useState({
    speed: 1 as 1 | 2 | -1 | -2,
    playing: "paused" as "paused" | "playing",
  });
  const t = useRef(0);
  const startingPoint = getStartingPoint(initialMap)
  const [map, setMap] = useState<Tile[][]>(initialMap);
  const flavoredMap = useRef<[boolean, Tile, Tile | null][][]>([])
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rover, setRover] = useState<RoverT>({
    energy: 100,
    inventory: [],
    logs: [],
    position: startingPoint,
    startingPosition: startingPoint,
  });
  const [path, setPath] = useState<Position[][]>([]);

  const setTickTo = useCallback((t: number) => {
    try {
      const actualTick = Math.max(0, Math.min(deltas.length - 1, t));
      if (actualTick == cycle.currentTick) return;
      if (!(deltas[actualTick] ?? undefined)) throw Error;
      setCycle(prev => {
        const nextTick = actualTick

        recalculateSnapshots(prev.currentTick, nextTick)

        return {
          ...prev,
          currentTick: nextTick,
          timeOfDay: nextTick % 48 >= 32 ? "night" : "day",
        }
      })
    } catch (e) {
      console.log("hiba") //TODO handle error or smth
    }
  }, [deltas, map, cycle.currentTick]);

  const recalculateSnapshots = useCallback((fromTick: number, toTick: number) => {
    const direction = toTick < fromTick ? -1 : 1
    const deltasToExecute =
      toTick < fromTick
        ? deltas.filter((d, i) => {
          return i <= fromTick && i > toTick;
        })
        : deltas.filter((_, i) => i > fromTick && i <= toTick)

    let position: Position = { ...rover!.position }
    let inventory: Item[] = [...rover!.inventory]
    let energy = rover!.energy;
    let logs: Log[] = [...rover!.logs];


    let newMap = deepCopy(flavoredMap.current);

    deltasToExecute.forEach(d => {
      energy = getEnergyForTick(toTick+1, deltas);
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
    flavoredMap.current = newMap;
  }, [deltas, rover])

  useEffect(() => {
    if (deltas.length > 1) return
    flavoredMap.current = generateFlavoredMap(map);
    const start = Date.now();
    const worker = new Worker(new URL('@/util/beamsearch.worker.ts', import.meta.url), { type: 'module' })
    worker.postMessage({
      type: "makePath",
      iterations: timeLimit,
      map: initialMap
    });
    worker.onmessage = (event) => {
      if (event.data.type === "makePathResult") {
        const end = Date.now()
        console.log("time: ", end - start)
        const path = event.data.result;
        setPath(path.path);
        console.log("path:", path.path)
        setDeltas(path.deltas);
        setIsLoading(false)
      }
      worker.terminate();
    };

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
      direction: cycleDirection,
      setDirection: (d: 1 | -1) => { setCycleDirection(d) },
      t: t,
    }}>
      <MapTimeLineContext.Provider value={{
        deltas: deltas,
        map: map,
        rover: rover ?? DefaultRoverContextObject,
        startingPoint: startingPoint,
        flavoredMap: flavoredMap.current,
        path: path
      }}>
        <Renderer />
        <GUI />
        <LoadingScreen isLoading={isLoading} />
      </MapTimeLineContext.Provider>
    </CycleContext.Provider>
  );
}
