import { RefObject } from "react"

export type CycleContextT = {
    currentTick: number,
    timeOfDay: "day" | "night",
    day: number,
    night: number,
    setTick: (tick: number) => void,
    player: {
        playing: "playing" | "paused",
        setPlaying: (state: "playing"|"paused") => void,
        speed: 1|2|-1|-2,
        setSpeed: (s: 1|2|-1|-2) => void
    }
    timeLimit: number,
    lastDirection: -1|1,
    t: RefObject<number>,
}