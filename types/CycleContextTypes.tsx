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
    isInAnimation: boolean,
    setIsInAnimation: (state: boolean)=>void,
    timeLimit: number,
    lastDirection: -1|1
}