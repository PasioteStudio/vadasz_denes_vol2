import { Tile } from "@/util/constants"
import { BarrierTile } from "@/Prefabs/BarrierTile";
import { NormalTile } from "@/Prefabs/NormalTile";
import { NormalTile1 } from "@/Prefabs/NormalTile1";
import { NormalTile2 } from "@/Prefabs/NormalTile2";
import { NormalTile3 } from "@/Prefabs/NormalTile3";
import { GoldTile } from "@/Prefabs/GoldTile";
import { WaterTile } from "@/Prefabs/WaterTile";
import { RareTile } from "@/Prefabs/RareTile";
import { BaseTile } from "@/Prefabs/BaseTile";

export const TILE_GAP = 2.1;

interface TileRendererProps {
  tile: Tile
  x: number
  y: number
}


export const TileRenderer = ({ tile, x, y }: TileRendererProps) => {
  const position: [number, number, number] = [x * TILE_GAP, 0, y * TILE_GAP]

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

      return <NormalTile  position={position} castShadow receiveShadow />
    
  }
}