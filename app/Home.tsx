"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CycleContext, DefaultRoverContextObject, MapTimeLineContext } from "@/lib/contexts"
import { CycleContextT } from "@/types/CycleContextTypes"
import { GUI } from "@/components/gui/GUI"
import { Renderer } from "@/components/rendering/Renderer"
import { Tile } from "@/lib/constants"
import { Delta } from "@/types/MapTimelineContextTypes"
import { Item, Log, Position, RoverT } from "@/types/RoverContextTypes"
import {
  getEnergyForTick,
  processInventoryChanges,
  processLogChanges,
  processMapChanges,
  processPositionChanges
} from "@/util/deltas"
import { generateFlavoredMap, getStartingPoint } from "@/util/map"
import { deepCopy } from "@/util/math"
import LoadingScreen from "@/components/loading/LoadingScreen"
import RuntimeDisplayer from "@/components/gui/RuntimeDisplayer"

export default function Home({
  timeLimit,
  initialMap
}: {
  timeLimit: number
  initialMap: Tile[][]
}) {
  const startingPoint = getStartingPoint(initialMap)!

  const [cycle, setCycle] = useState<Omit<CycleContextT, "t" | "player" | "timeLimit" | "direction" | "setDirection">>({
    currentTick: 0,
    timeOfDay: "day",
    setTick: (t: number) => setTickTo(t),
    day: 32,
    night: 16
  })

  const [cycleDirection, setCycleDirection] = useState<-1 | 1>(1)

  const [player, setPlayer] = useState({
    snapToggle: false,
    speed: 1 as 1 | 2 | -1 | -2,
    playing: "paused" as "paused" | "playing"
  })

  const [map] = useState<Tile[][]>(initialMap)
  const [deltas, setDeltas] = useState<Delta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [path, setPath] = useState<Position[][]>([])
  const [runTime, setRuntime] = useState(0);

  const [rover, setRover] = useState<RoverT>({
    energy: 100,
    inventory: [],
    logs: [],
    position: startingPoint,
    startingPosition: startingPoint
  })
  
  const roverRef = useRef<RoverT>(rover)

  const t = useRef(0)
  const flavoredMap = useRef<[boolean, Tile, Tile | null][][]>([])

  /**
   * A jelenlegi és a cél tick közötti deltákból visszaad egy snapshotot.
   * @param fromTick jelen tick
   * @param toTick cél tick
   */
  const recalculateSnapshots = useCallback(
    (fromTick: number, toTick: number) => {
      const direction = toTick < fromTick ? -1 : 1

      let deltasToExecute =
        toTick < fromTick
          ? deltas.filter((_, i) => i <= fromTick && i > toTick)
          : deltas.filter((_, i) => i > fromTick && i <= toTick)

      if (direction === -1) deltasToExecute = deltasToExecute.reverse()

      const baseRover = roverRef.current
      let position: Position = { ...baseRover.position }
      let inventory: Item[] = [...baseRover.inventory]
      let logs: Log[] = [...baseRover.logs]
      let newMap = deepCopy(flavoredMap.current)

      for (const d of deltasToExecute) {
        position = processPositionChanges(position, d.moves, direction)
        inventory = processInventoryChanges(inventory, d.inventoryChanges, direction)
        logs = processLogChanges(logs, d.logsAdded, direction)
        newMap = processMapChanges(newMap, d.moves, direction)
      }

      const energy = getEnergyForTick(toTick + 1, deltas)
      const nextRover: RoverT = {
        ...baseRover,
        energy,
        inventory,
        logs,
        position
      }
      roverRef.current = nextRover
      setRover(nextRover)

      flavoredMap.current = newMap
    },
    [deltas]
  )

  /**
   * Megpróbálja beállítani a szimuláció tickjét, és mindent, ami ehhez kapcsolódik.
   * @param next a cél tick
   */
  const setTickTo = useCallback(
    (next: number) => {
      const actualTick = Math.max(0, Math.min(deltas.length - 1, next))
      if (!deltas[actualTick]) throw Error()

      setCycle(prev => {
        if (actualTick === prev.currentTick) return prev
        recalculateSnapshots(prev.currentTick, actualTick)

        return {
          ...prev,
          currentTick: actualTick,
          timeOfDay: actualTick % 48 >= 32 ? "night" : "day"
        }
      })
    },
    [deltas, recalculateSnapshots]
  )

  // INIT useEffect, mikor megkapjuk a kiindulási mapot.
  useEffect(() => {
    if (deltas.length > 1) return

    // A szebb térkép legyártása
    flavoredMap.current = generateFlavoredMap(map)

    // Worker-rel elindítjuk az algoritmust. Így nem függesztjük fel
    // a main thread-et, és meg tudjuk jeleníteni a töltő képernyőt.
    // Az algoritmus lefutási ideje console-ban látható egyelőre.
    const start = Date.now()
    const worker = new Worker(
      new URL("@/util/beamsearch.worker.ts", import.meta.url),
      { type: "module" }
    )

    worker.postMessage({
      type: "makePath",
      iterations: timeLimit,
      map: initialMap
    })

    worker.onmessage = event => {
      if (event.data.type === "makePathResult") {
        const end = Date.now()
        setRuntime(end - start);

        const result = event.data.result
        setPath(result.path)
        setDeltas(result.deltas)
        setIsLoading(false)
      }

      worker.terminate()
    }
  }, [initialMap, map, deltas.length, timeLimit])

  return (
    <CycleContext.Provider
      value={{
        currentTick: cycle.currentTick,
        timeOfDay: cycle.timeOfDay,
        setTick: setTickTo,
        player: {
          snapToggle: player.snapToggle,
          playing: player.playing,
          speed: player.speed,
          setSnapToggle: toggle => setPlayer(p => ({ ...p, snapToggle: toggle })),
          setPlaying: state => setPlayer(p => ({ ...p, playing: state })),
          setSpeed: speed => setPlayer(p => ({ ...p, speed }))
        },
        day: cycle.day,
        night: cycle.night,
        timeLimit,
        direction: cycleDirection,
        setDirection: setCycleDirection,
        t
      }}
    >
      <MapTimeLineContext.Provider
        value={{
          deltas,
          map,
          rover: rover ?? DefaultRoverContextObject,
          startingPoint,
          flavoredMap: flavoredMap.current,
          path
        }}
      >
        <Renderer />
        <GUI />
        <RuntimeDisplayer runtime={runTime} />
        <LoadingScreen isLoading={isLoading} />
      </MapTimeLineContext.Provider>
    </CycleContext.Provider>
  )
}