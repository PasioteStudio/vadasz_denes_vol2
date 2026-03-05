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
  map: Tile[][],
  bounds: {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
  }
): Map<Tile, TilePositionGroup> {
  const groups = new Map<Tile, TilePositionGroup>();

  // Validate bounds to ensure they're within map dimensions
  const rows = map.length;
  const cols = map[0]?.length || 0;
  
  // Debug logging for bounds validation
  if (bounds.minRow > bounds.maxRow || bounds.minCol > bounds.maxCol) {
    console.warn('Invalid bounds (min > max):', bounds);
  }
  
  if (bounds.minRow < 0 || bounds.maxRow >= rows || bounds.minCol < 0 || bounds.maxCol >= cols) {
    console.warn('Bounds partially outside map:', bounds, 'map:', rows, 'x', cols);
  }

  // Ensure bounds are within valid range
  const safeMinRow = Math.max(0, bounds.minRow);
  const safeMaxRow = Math.min(rows - 1, bounds.maxRow);
  const safeMinCol = Math.max(0, bounds.minCol);
  const safeMaxCol = Math.min(cols - 1, bounds.maxCol);

  for (let row = safeMinRow; row <= safeMaxRow; row++) {
    for (let col = safeMinCol; col <= safeMaxCol; col++) {
      const field = map[row]?.[col];
      if (!field) continue;

      const tileType = field;
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
