import { Tile } from "@/util/constants"
import { BarrierTile } from "@/Prefabs/BarrierTile";
import { NormalTile } from "@/Prefabs/NormalTile";
import { GoldTile } from "@/Prefabs/GoldTile";
import { WaterTile } from "@/Prefabs/WaterTile";

import { RareTile } from "@/Prefabs/RareTile";
import { BaseTile } from "@/Prefabs/BaseTile";

export const TILE_GAP = 2.2; // tile spacing constant that can be imported elsewhere
//here is the tile
interface TileRendererProps {
  tile: Tile
  x: number
  y: number
}

export const TileRenderer = ({ tile, x, y }: TileRendererProps) => {
  const gap = TILE_GAP;
  const position: [number, number, number] = [x * gap, 0, y * gap ];
//switch that determines wich tile to use
  switch (tile) {
    case Tile.Obstacle:
      return <BarrierTile position={position} castShadow receiveShadow />

    case Tile.Blue:
        return <WaterTile position={position} castShadow receiveShadow />
    case Tile.Green:
        return <RareTile position={position} castShadow receiveShadow />
    case Tile.Yellow:
      return <GoldTile position={position} castShadow receiveShadow />

    case Tile.Start:
      return <BaseTile position={position} castShadow receiveShadow />

    default:
      return <NormalTile position={position} castShadow receiveShadow />
  }
}