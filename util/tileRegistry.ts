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
};

/**
 * Get the GLTF path for a given tile type
 */
export function getTileModelPath(tileType: Tile): string {
  return TILE_REGISTRY[tileType];
}

/**
 * Check if a tile type is registered
 */
export function isTileTypeRegistered(tileType: Tile): boolean {
  return TILE_REGISTRY[tileType] !== undefined;
}
