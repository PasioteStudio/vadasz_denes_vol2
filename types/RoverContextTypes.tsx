export type Position = {
    x: number,
    y: number,
} 
export type Item = {
    name: string,
    amount: number,
}
export type Log = {
    postition: Position,
    consumption: number,
    inventory: Item[],
    message: string
}
export type RoverContextT = {
    position: {
        get: Position,
        set: (position: Position) => void,
    },
    logs: {
        get: Log[],
        set: (logs: Log[]) => void,
    },
    inventory: {
        get: Item[],
        set: (items: Item[]) => void
    }
}