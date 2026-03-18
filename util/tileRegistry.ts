import { Tile } from '../lib/constants';

/**
 * Tile Registry: Mezők GLTF model útvonallá alakítása
 * 
 * Kicsit rút szegény, de ez volt a leggyorsabb megoldás két este között, 
 * mikor nap közben az életemért küzdök.
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
  [Tile.OV1]: '/Modells/akadaly.glb',
  [Tile.OV2]: '/Modells/akadaly1.glb',
  [Tile.OV3]: '/Modells/akadaly2.glb',
};

/**
 * GLTF útvonal lekérése az adott Mező típushoz
 * @returns `string` elérési út
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
 * Regisztrálva van a mező modellje?
 * @returns `boolean`
 */
export function isTileTypeRegistered(tileType: Tile): boolean {
  return TILE_REGISTRY[tileType] !== undefined;
}
