import { Tile } from "@/lib/constants";
import { useTimeline, useUIHelper } from "@/lib/contexts";
import { useState, useEffect } from "react";

export default function MapExportButton() {
    const {resting, restingOpacity} = useUIHelper();
    const [text, setText] = useState("");
    const firstmap = useTimeline().map;

    useEffect(() => {
        const lines: string[] = [];
        firstmap?.forEach(r => {
            const line = r.map(f => toMapTile(f)).join(',');
            lines.push(line);
        });
        setText(lines.join("\n"));
    }, [firstmap])
    return <button className="cursor-pointer bg-[#1e1e2f]/90 border border-[#ff4500] text-[#ffdda0] rounded-lg shadow-lg p-2 text-sm" onClick={() => {
        const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "map.csv");
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }} style={{opacity: resting ? restingOpacity/100 : 1}}>export map</button>
}

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