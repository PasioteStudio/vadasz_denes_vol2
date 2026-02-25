export type CycleContextT = {
    currentTick: number,
    timeOfDay: "day" | "night",
    setTick: (tick: number) => void,
    player: {
        playing: "playing" | "paused",
        setPlaying: (state: "playing"|"paused") => void,
        speed: 1|2,
        setSpeed: (s: 1|2) => void
    }
}