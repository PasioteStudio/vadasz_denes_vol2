import { MapSnapshot } from "./MapTypes"

export type MapSnapshotsContextT = {
    snapshots: {
        get: Map<Number, MapSnapshot>,
        set: (sh: Map<Number, MapSnapshot>) => void,
    }
}