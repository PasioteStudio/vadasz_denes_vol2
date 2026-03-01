import { groupTilesByType } from "@/util/tileGrouping";
import { useMemo } from "react";
import { InstancedTileGroup } from "./InstancedTileGroup";
import { Position, RoverT } from "@/types/RoverContextTypes";
import { Field } from "@/types/MapTypes";
import { TILE_GAP } from "./TileRenderer";
import { clampNum } from "@/util/math";

type Bounds = { minRow: number; maxRow: number; minCol: number; maxCol: number };
const VISIBLE_ROWS = 26;
const VISIBLE_COLS = 27;
const RADIUS_ROWS = Math.floor(VISIBLE_ROWS / 2);
const RADIUS_COLS = Math.floor(VISIBLE_COLS / 2);
const rxOffset = RADIUS_COLS / 2;
const ryOffset = RADIUS_ROWS / 2;

export default function MapRenderer({
    map,
    direction,
    rover,
    camH,
}: {
    map: Field[][],
    direction: Position,
    rover: RoverT,
    camH: number,
}) {
    const GAP = TILE_GAP
    const camTile = useMemo(() => {
        const camXraw = Math.round((direction.x + (rover?.position.x ?? 0) * GAP) / GAP);
        const camYraw = Math.round((direction.y + (rover?.position.y ?? 0) * GAP) / GAP) - camH * 0.75 * (2.5 / GAP);

        if (!map) return { x: camXraw, y: camYraw };

        const rows = map.length;
        const cols = map[0]?.length || 0;

        const camX = Math.floor(clampNum(camXraw, rxOffset, cols - 1 - rxOffset));
        const camY = Math.floor(clampNum(camYraw, ryOffset, rows - 1 - ryOffset));
        return { x: camX, y: camY };
    }, [direction, rover, map]);

    const bounds = useMemo<Bounds | null>(() => {

        if (!map) return null;
        const rows = map.length;
        const cols = map[0]?.length || 0;

        const minRow = clampNum(camTile.y - RADIUS_ROWS, 0, rows - 1);
        const maxRow = clampNum(camTile.y + RADIUS_ROWS, 0, rows - 1);
        const minCol = clampNum(camTile.x - RADIUS_COLS, 0, cols - 1);
        const maxCol = clampNum(camTile.x + RADIUS_COLS, 0, cols - 1);

        // ensure integer indices
        return {
            minRow: Math.floor(minRow),
            maxRow: Math.floor(maxRow),
            minCol: Math.floor(minCol),
            maxCol: Math.floor(maxCol),
        };
    }, [camTile, map]);

    const tileGroups = useMemo(() => {
        if (!map || !bounds) return null;
        return groupTilesByType(map, bounds);
    }, [map, bounds]);

    return <>{map && bounds && tileGroups &&
        Array.from(tileGroups.values())
            .filter((g) => g.positions.length > 0)
            .map((group) => (
                <InstancedTileGroup key={`tile-group-${group.tileType}`} tileType={group.tileType} positions={group.positions} castShadow receiveShadow tileGap={GAP} />
            ))
    }</>
}