import { Tile } from '@/lib/constants';

export interface TilePositionGroup {
  tileType: Tile;
  positions: Array<{ x: number; y: number; index: number }>;
}

/**
 * GPU Instancing használatához mező csoportokra osztja a térképet.
 * @param map A térkép az adott pillanatban
 * @param bounds A kamera állása alapján meghatározott határok (culling miatt)
 * @returns`Map<Tile, TilePositionGroup>` - Mező alapján létrehozott csoportok
 */
export function groupTilesByType(
  map: [boolean, Tile, Tile|null][][],
  bounds: {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
  }
): Map<Tile, TilePositionGroup> {
  const groups = new Map<Tile, TilePositionGroup>();

  const rows = map.length;
  const cols = map[0]?.length || 0;
  
  // Határok validálása, mert hát emberek vagyunk
  if (bounds.minRow > bounds.maxRow || bounds.minCol > bounds.maxCol) {
    console.warn('Helytelen határok (min > max): ', bounds);
  }
  
  if (bounds.minRow < 0 || bounds.maxRow >= rows || bounds.minCol < 0 || bounds.maxCol >= cols) {
    console.warn('Határok részlegesen a térképen kívül:', bounds, 'map:', rows, 'x', cols);
  }

  // További validálások
  const safeMinRow = Math.max(0, bounds.minRow);
  const safeMaxRow = Math.min(rows - 1, bounds.maxRow);
  const safeMinCol = Math.max(0, bounds.minCol);
  const safeMaxCol = Math.min(cols - 1, bounds.maxCol);

  // Csoportok leképezése
  for (let row = safeMinRow; row <= safeMaxRow; row++) {
    for (let col = safeMinCol; col <= safeMaxCol; col++) {
      const currentRecord = map[row]?.[col];
      const tile = currentRecord[0] ? currentRecord[2]! : currentRecord[1];
      if (tile === undefined) continue;

      const tileType = tile;
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
