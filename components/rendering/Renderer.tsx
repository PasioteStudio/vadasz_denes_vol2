import { useCycle, useSnapshots } from '@/lib/contexts';
import { MarsRover } from '@/Prefabs/MarsRover';
import { Field } from '@/types/MapTypes';
import { Position } from '@/types/RoverContextTypes';
import { useKeyboard } from '@/util/controlls';
import { PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { InstancedTileGroup } from './InstancedTileGroup';
import { groupTilesByType } from '@/util/tileGrouping';
import InventoryPopup from '../gui/InventoryPopup';

// Layout / rendering constants
const CAM_HEIGHT = 60;
const VISIBLE_ROWS = 26;
const VISIBLE_COLS = 27;
const RADIUS_ROWS = Math.floor(VISIBLE_ROWS / 2);
const RADIUS_COLS = Math.floor(VISIBLE_COLS / 2);

type Bounds = { minRow: number; maxRow: number; minCol: number; maxCol: number };

function clampNum(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export const Renderer = () => {
  const { currentTick } = useCycle();
  const { timeOfDay } = useCycle();
  const snapshots = useSnapshots();

  const [direction, setDirection] = useState<Position>({ x: 0, y: 110 });
  const [fov, setFov] = useState<number>(10);
  const [isInventoryOpen, setInventoryOpen] = useState(false);

  const map = snapshots.snapshots.get(currentTick)?.fields;
  const rover = snapshots.snapshots.get(currentTick)?.rover;

  const GAP = 2.5; // keep this local; TILE_GAP is defined in TileRenderer

  const rxOffset = RADIUS_COLS / 2;
  const ryOffset = RADIUS_ROWS / 2;

  // Compute camera tile based on direction + rover position
  const camTile = useMemo(() => {
    const camXraw = Math.round((direction.x + (rover?.position.x ?? 0) * GAP) / GAP);
    const camYraw = Math.round((direction.y + (rover?.position.y ?? 0) * GAP) / GAP) - CAM_HEIGHT * 0.77;

    if (!map) return { x: camXraw, y: camYraw };

    const rows = map.length;
    const cols = map[0]?.length || 0;

    const camX = Math.floor(clampNum(camXraw, rxOffset, cols - 1 - rxOffset));
    const camY = Math.floor(clampNum(camYraw, ryOffset, rows - 1 - ryOffset));
    return { x: camX, y: camY };
  }, [direction, rover, map]);

  // Compute visible bounds (clamped to map dimensions)
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

  // Group tiles by type for instancing (only when map & bounds valid)
  const tileGroups = useMemo(() => {
    if (!map || !bounds) return null;
    return groupTilesByType(map, bounds);
  }, [map, bounds]);

  const keys = useKeyboard();
  const directionRef = useRef<Position>(direction);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // keyboard-based camera movement
  useEffect(() => {
    if (isInventoryOpen) return;
    const speed = 40; // units per second
    let lastTime = Date.now();
    let animFrameId: number;

    const loop = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setDirection((prev) => {
        let dx = 0;
        let dy = 0;
        let actualSpeed = speed;
        if (keys.current.shift) actualSpeed *= 2;
        if (keys.current.w) dy -= actualSpeed * deltaTime;
        if (keys.current.s) dy += actualSpeed * deltaTime;
        if (keys.current.a) dx -= actualSpeed * deltaTime;
        if (keys.current.d) dx += actualSpeed * deltaTime;
        if (dx === 0 && dy === 0) return prev;
        return { x: prev.x + dx, y: prev.y + dy };
      });

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameId);
  }, [keys, isInventoryOpen]);

  // scroll-to-zoom
  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      setFov((prev) => Math.max(10, Math.min(13, prev + e.deltaY * 0.01)));
    };
    window.addEventListener('wheel', handleScroll);
    return () => window.removeEventListener('wheel', handleScroll);
  }, []);

  return (
    <>
      <Canvas style={{ width: '100vw', height: '100vh' }}>
        <PerspectiveCamera
          makeDefault
          position={[direction.x + (rover?.position.x ?? 0) * 2.5, CAM_HEIGHT, direction.y + (rover?.position.y ?? 0) * 2.5]}
          rotation={[-0.5, 0, 0]}
          fov={fov}
        />

        <ambientLight intensity={timeOfDay == 'day' ? 1 : 0.5} color={0xffaaaa} />
        <directionalLight intensity={timeOfDay == 'day' ? 1 : 0} position={[-2, 2, -1]} color={0xffffff} />
        <directionalLight intensity={timeOfDay == 'night' ? 1 : 0} position={[-2, 2, -1]} color={0x0000ff} />

        {map && bounds && tileGroups &&
          Array.from(tileGroups.values())
            .filter((g) => g.positions.length > 0)
            .map((group) => (
              <InstancedTileGroup key={`tile-group-${group.tileType}`} tileType={group.tileType} positions={group.positions} castShadow receiveShadow tileGap={GAP} />
            ))}

        {rover && <MarsRover targetPos={{ x: rover.position.x, y: rover.position.y }} />}
      </Canvas>

      {isInventoryOpen && <InventoryPopup />}
    </>
  );
};