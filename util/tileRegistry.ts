import { Tile } from './constants';

/**
 * Tile Registry: Maps Tile enum to GLTF model paths
 * This is the single source of truth for tile-to-model mapping.
 * Add new tiles here to enable instancing automatically.
 */
export const TILE_REGISTRY: Record<Tile, string> = {
  [Tile.Obstacle]: '/Modells/akadaly.glb',
  [Tile.Empty]: '/Modells/normalmarssurface.glb',
  [Tile.Blue]: '/Modells/kek.glb',
  [Tile.Yellow]: '/Modells/arany.glb',
  [Tile.Green]: '/Modells/räriteten.glb',
  [Tile.Start]: '/Modells/base.glb',
  [Tile.EV1]: '/Modells/normalmarssurface1.glb',
  [Tile.EV2]: '/Modells/normalmarssurface2.glb',
  [Tile.EV3]: '/Modells/normalmarssurface3.glb',
  [Tile.BV1]: '/Modells/kek.glb',
  [Tile.BV2]: '/Modells/kek1.glb',
  [Tile.BV3]: '/Modells/kek2.glb',
  [Tile.YV1]: '/Modells/arany.glb',
  [Tile.YV2]: '/Modells/arany1.glb',
  [Tile.YV3]: '/Modells/arany2.glb',
  [Tile.GV1]: '/Modells/räriteten.glb',
  [Tile.GV2]: '/Modells/räriteten1.glb',
  [Tile.GV3]: '/Modells/räriteten2.glb',
};

/**
 * Get the GLTF path for a given tile type
 */
export function getTileModelPath(tileType: Tile): string | string[] {
  const path = TILE_REGISTRY[tileType];

  if (!path) {
    console.error(`No model registered for tile type: ${tileType}`);
    return "";
  }

  if (tileType === Tile.Empty && Array.isArray(path)) {
    return path;
  }

  return path as string;
}

/**
 * Check if a tile type is registered
 */
export function isTileTypeRegistered(tileType: Tile): boolean {
  return TILE_REGISTRY[tileType] !== undefined;
}
