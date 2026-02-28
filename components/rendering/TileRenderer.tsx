import { Tile } from "@/util/constants"
import { BarrierTile } from "@/Prefabs/BarrierTile";
import { NormalTile } from "@/Prefabs/NormalTile";
import { GoldTile } from "@/Prefabs/GoldTile";
import { WaterTile } from "@/Prefabs/WaterTile";

import { RareTile } from "@/Prefabs/RareTile";
import { BaseTile } from "@/Prefabs/BaseTile";
//here is the tile
interface TileRendererProps {
  tile: Tile
  x: number
  y: number
}

export const TileRenderer = ({ tile, x, y }: TileRendererProps) => {
  const gap = 2.5; // Adjust this value to increase/decrease the gap between tiles
  const position: [number, number, number] = [x*gap, 0, y*gap ]
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