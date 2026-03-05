import BatteryDisplayer from "@/components/gui/BatteryDisplayer";
import CurrentAction from "@/components/gui/CurrentAction";
import DayNightCycleDisplayer from "@/components/gui/DayNightCycleDisplayer";
import LogDisplayer from "@/components/gui/LogDisplayer";
import TimeControlButtons from "@/components/gui/TimeControlButtons";
import { useTimeline } from "@/lib/contexts";

import { Tile } from "@/util/constants";
import { useEffect, useState } from "react";

const toMapTile = (tile: Tile): string => {
    switch (tile) {
        case Tile.Start: return "S";
        case Tile.Obstacle: return "#";
        case Tile.Yellow: return "Y";
        case Tile.Green: return "G";
        case Tile.Blue: return "B";
        default: return '.';
    }
}
export function GUI() {
    const [text, setText] = useState("");

    useEffect(() => {
        const firstmap = useTimeline().map;
        let _txt = "";
        firstmap?.forEach(r => {
            const line = r.map(f => toMapTile(f)).join(',')
            _txt += line + "\n"
        })
        setText(_txt);
    }, [])

    return <>
        <div className="pointer-events-none absolute w-full h-full top-0 left-0 bg-radial from-transparent from-20% to-85% to-black/80"></div>
        <DayNightCycleDisplayer />
        <BatteryDisplayer />
        <TimeControlButtons />
        <LogDisplayer />
        <CurrentAction />
        <button className="fixed bottom-0 left-0" onClick={() => {
            const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "map.csv");
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }}>export map</button>
    </>
}