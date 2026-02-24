export type CycleContextT = {
    currentTick: number,
    timeOfDay: "day" | "night",
    setTick: (tick: number) => void,
}