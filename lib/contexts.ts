"use client"
import { CycleContextT } from "@/types/CycleContextTypes";
import { MapSnapshotsContextT } from "@/types/MapSnapshotContextTypes";
import { MapSnapshot } from "@/types/MapTypes";
import { RoverAction, RoverContextT } from "@/types/RoverContextTypes";
import { createContext, useContext } from "react";

export const DefaultRoverContextObject: RoverContextT = {
    position: {
        get: {x:0,y:0},
        set: ()=>{}
    },
    logs: {
        get: [],
        set: ()=>{}
    },
    inventory: {
        get: [],
        set: () => {}
    },
    startingPosition: {
        get: {x:0,y:0},
        set: ()=>{}
    },
    currentAction : {
        get: {
            action:"wait",
        },
        set: () => {},
    },
    energy: {
        get: 0,
        set: ()=>{}
    }
}
export const DefaultCycleContextObject: CycleContextT = {
    currentTick: 0,
    timeOfDay: "day",
    setTick: ()=>{}
}
export const DefaultSnapshotsContextObject: MapSnapshotsContextT = {
    snapshots: {
        get: new Map<Number, MapSnapshot>(),
        set: ()=>{}
    }
}

export const RoverContext = createContext<RoverContextT>({...DefaultRoverContextObject});
export const useRover = ():RoverContextT => {
    const ctx = useContext(RoverContext);
    if(!ctx) throw new Error("Context needs to be initialized, ya buffoon");
    return ctx;
}

export const CycleContext = createContext<CycleContextT>({...DefaultCycleContextObject})
export const useCycle = ():CycleContextT => {
    const ctx = useContext(CycleContext);
    if(!ctx) throw new Error("Context needs to be initialized, ya buffoon");
    return ctx;
}

export const MapSnapshotsContext = createContext<MapSnapshotsContextT>({...DefaultSnapshotsContextObject})
export const useSnapshots = ():MapSnapshotsContextT => {
    const ctx = useContext(MapSnapshotsContext);
    if(!ctx) throw new Error("Context needs to be initialized, ya buffoon");
    return ctx;
}