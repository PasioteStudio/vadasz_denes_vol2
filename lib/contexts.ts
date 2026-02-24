import { RoverContextT } from "@/types/RoverContextTypes";
import { createContext, useContext } from "react";

export const DefaultRoverContextObject = {
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
    }
}
export const RoverContext = createContext<RoverContextT>({...DefaultRoverContextObject});

export const useRover = ():RoverContextT => {
    const ctx = useContext(RoverContext);
    if(!ctx) throw new Error("Context needs to be initialized, ya buffoon");
    return ctx;
}

