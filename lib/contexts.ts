"use client"
import { CycleContextT } from "@/types/CycleContextTypes";
import { MapSnapshotsContextT } from "@/types/MapSnapshotContextTypes";
import { MapSnapshot } from "@/types/MapTypes";
import { RoverAction, RoverT } from "@/types/RoverContextTypes";
import { UIHelperContextT } from "@/types/UIHelperContextTypes";
import { createContext, useContext } from "react";

export const DefaultRoverContextObject: RoverT = {
    position: { x: 0, y: 0 },
    logs: [],
    inventory: [],
    startingPosition: { x: 0, y: 0 },
    currentAction: {
        action: "wait",
    },
    energy: 0
}
export const DefaultCycleContextObject: CycleContextT = {
    currentTick: 0,
    timeOfDay: "day",
    day: 16*2, //A nappal időtartama 16 óra, az éjszaka 8 óra
    night: 8*2,
    setTick: () => { },
    player: {
        speed: 1,
        playing: "paused",
        setPlaying: () => { },
        setSpeed: () => { },
    },
    timeLimit: 48,
    isInAnimation: false,
    lastDirection: 1,
    setIsInAnimation: ()=>{},
}
export const DefaultSnapshotsContextObject: MapSnapshotsContextT = {
    snapshots: new Map<Number, MapSnapshot>()
}

export const DefaultUIHelperContextObject: UIHelperContextT = {
    resting: false,
    restingOpacity: 30,
}

export const CycleContext = createContext<CycleContextT>({ ...DefaultCycleContextObject })
export const useCycle = (): CycleContextT => {
    const ctx = useContext(CycleContext);
    if (!ctx) throw new Error("Context needs to be initialized, ya buffoon");
    return ctx;
}

export const MapSnapshotsContext = createContext<MapSnapshotsContextT>({ ...DefaultSnapshotsContextObject })
export const useSnapshots = (): MapSnapshotsContextT => {
    const ctx = useContext(MapSnapshotsContext);
    if (!ctx) throw new Error("Context needs to be initialized, ya buffoon");
    return ctx;
}

export const UIHelperContext = createContext<UIHelperContextT>({ ...DefaultUIHelperContextObject })
export const useUIHelper = (): UIHelperContextT => {
    const ctx = useContext(UIHelperContext);
    if (!ctx) throw new Error("Context needs to be initialized, ya buffoon");
    return ctx;
}