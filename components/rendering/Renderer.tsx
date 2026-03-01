import { useCycle, useSnapshots } from '@/lib/contexts';
import { MarsRover } from '@/Prefabs/MarsRover';
import { Field } from '@/types/MapTypes';
import { Position } from '@/types/RoverContextTypes';
import { useKeyboard } from '@/util/controlls';
import { PerspectiveCamera as PerspectiveCameraComponent } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { InstancedTileGroup } from './InstancedTileGroup';
import { groupTilesByType } from '@/util/tileGrouping';
import InventoryPopup from '../gui/InventoryPopup';
import { TILE_GAP } from './TileRenderer';
import { PerspectiveCamera } from 'three';

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
  const { currentTick, timeOfDay, day, night } = useCycle();
  const snapshots = useSnapshots();

  const cameraRef = useRef<PerspectiveCamera | null>(null)
  const [direction, setDirection] = useState<Position>({ x: 0, y: 110 });
  const [fov, setFov] = useState<number>(10);
  const [isInventoryOpen, setInventoryOpen] = useState(false);

  const [lightOrbitPosition, setOrbitPosition] = useState<[number, number, number]>([-2, 2, -1]);

  const map = snapshots.snapshots.get(currentTick)?.fields;
  const rover = snapshots.snapshots.get(currentTick)?.rover;

  const GAP = TILE_GAP; // keep this local; TILE_GAP is defined in TileRenderer

  const rxOffset = RADIUS_COLS / 2;
  const ryOffset = RADIUS_ROWS / 2;

  //snap to rover
  useEffect(() => {
    setDirection({ x: 0, y: 110 })
  }, [rover])

  // Compute camera tile based on direction + rover position
  const camTile = useMemo(() => {
    const camXraw = Math.round((direction.x + (rover?.position.x ?? 0) * GAP) / GAP);
    const camYraw = Math.round((direction.y + (rover?.position.y ?? 0) * GAP) / GAP) - CAM_HEIGHT * 0.75 * (2.5 / GAP);

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

  //LOOK AROUND
  // Camera rotation state (in radians)
  const [yaw, setYaw] = useState(0); // left/right
  const [pitch, setPitch] = useState(-0.5); // up/down, default -0.5 for initial tilt
  const isDragging = useRef(false);
  const lastMouse = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  // Mouse-based camera rotation
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left button
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      // Sensitivity factors
      setYaw((prev) => prev - dx * 0.005);
      setPitch((prev) => {
        const next = prev - dy * 0.005;
        // Clamp pitch to avoid flipping
        return Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, next));
      });
    };
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  //LOOK AROUND

  //INVENTORY TOGGLE
  const showInventory = () => {
  setInventoryOpen(prev => !prev);
};
  //INVENTORY TOGGLE


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

  useEffect(() => {
    const tod = timeOfDay;
    const duration = tod == "day" ? day : night;
    const relTick = (currentTick % 48) - (tod == "day" ? 0 : day);
    const ratio = relTick / duration;

    const t = clampNum(ratio, 0,1);
    const angle = -Math.PI / 2 + t * Math.PI;
    const radius = 2;

    const x = Math.sin(angle) * radius;
    const y = Math.cos(angle) * radius;
    const z = -1;

    setOrbitPosition([x, y, z]);
  }, [currentTick])

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
        <PerspectiveCameraComponent
          ref={cameraRef}
          makeDefault
          position={[direction.x + (rover?.position.x ?? 0) * GAP, CAM_HEIGHT, direction.y + (rover?.position.y ?? 0) * GAP]}
          rotation={[pitch, yaw, 0]}
          fov={fov}
        />

        <ambientLight intensity={timeOfDay == 'day' ? 1 : 0.5} color={0xff6666} />
        <directionalLight intensity={timeOfDay == 'day' ? 1 : 0} position={lightOrbitPosition} color={0xffffff} />
        <directionalLight intensity={timeOfDay == 'night' ? 1 : 0} position={lightOrbitPosition} color={0xaaaaff} />

        {map && bounds && tileGroups &&
          Array.from(tileGroups.values())
            .filter((g) => g.positions.length > 0)
            .map((group) => (
              <InstancedTileGroup key={`tile-group-${group.tileType}`} tileType={group.tileType} positions={group.positions} castShadow receiveShadow tileGap={GAP} />
            ))}

        {rover && <MarsRover targetPos={{ x: rover.position.x, y: rover.position.y } } onSelect={showInventory} />}
      </Canvas>

      {isInventoryOpen && (
        <InventoryPopup onClose={() => setInventoryOpen(false)} />
      )}
    </>
  );
};