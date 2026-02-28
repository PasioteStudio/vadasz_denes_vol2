import { Field } from '@/types/MapTypes';
import { Tile } from '@/util/constants';

export interface TilePositionGroup {
  tileType: Tile;
  positions: Array<{ x: number; y: number; index: number }>;
}

/**
 * Groups tiles by type within the visible bounds
 * Used for efficient instanced rendering
 */
export function groupTilesByType(
  map: Field[][],
  bounds: {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
  }
): Map<Tile, TilePositionGroup> {
  const groups = new Map<Tile, TilePositionGroup>();

  for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
    for (let col = bounds.minCol; col <= bounds.maxCol; col++) {
      const field = map[row]?.[col];
      if (!field) continue;

      const tileType = field.tile;
      if (!groups.has(tileType)) {
        groups.set(tileType, {
          tileType,
          positions: [],
        });
      }

      const group = groups.get(tileType)!;
      group.positions.push({
        x: col,
        y: row,
        index: group.positions.length,
      });
    }
  }

  return groups;
}
