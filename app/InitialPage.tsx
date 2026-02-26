import { Tile } from "@/util/constants";

export default function InitialPage({setTimeLimit, setInitialMap}:{setTimeLimit: (limit:number) => void, setInitialMap: (tiles: Tile[]) => void}) {
    return <div>
        <h1>INITIAL</h1>
    </div>
}