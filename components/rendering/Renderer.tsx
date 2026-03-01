import { useCycle, useSnapshots } from '@/lib/contexts';
import { MarsRover } from '@/Prefabs/MarsRover';
import { Position } from '@/types/RoverContextTypes';
import { useKeyboard } from '@/util/controlls';
import { PerspectiveCamera as PerspectiveCameraComponent } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import InventoryPopup from '../gui/InventoryPopup';
import { TILE_GAP } from './TileRenderer';
import { PerspectiveCamera } from 'three';
import DayNightDirectionalLights from './DayNightDirectonalLight';
import MapRenderer from './MapRenderer';

// Layout / rendering constants
const CAM_HEIGHT = 60;

export const Renderer = () => {
  const { currentTick, timeOfDay, day, night } = useCycle();
  const snapshots = useSnapshots();

  const cameraRef = useRef<PerspectiveCamera | null>(null)
  const [direction, setDirection] = useState<Position>({ x: 0, y: 110 });
  const [fov, setFov] = useState<number>(10);
  const [isInventoryOpen, setInventoryOpen] = useState(false);
  const [cameraRotationEnabled, setCamRotEnabled] = useState(false);

  const map = snapshots.snapshots.get(currentTick)?.fields;
  const rover = snapshots.snapshots.get(currentTick)?.rover;

  const GAP = TILE_GAP;

  //snap to rover
  useEffect(() => {
    setDirection({ x: 0, y: 110 })
  }, [rover])

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
      if(!cameraRotationEnabled) return;
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
  }, [cameraRotationEnabled]);
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

  // scroll-to-zoom
  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      setFov((prev) => Math.max(10, Math.min(13, prev + e.deltaY * 0.01)));
    };
    const handleCameraToggle = (e: KeyboardEvent) => {
      if(e.key.toLowerCase() == "f") setCamRotEnabled(p => !p);
    }
    window.addEventListener('wheel', handleScroll);
    window.addEventListener('keydown', handleCameraToggle);
    return () => {window.removeEventListener('wheel', handleScroll);window.removeEventListener('keydown', handleCameraToggle)};
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
        <DayNightDirectionalLights />

        <MapRenderer map={map!} direction={direction} rover={rover!} camH={CAM_HEIGHT}/>

        {rover && <MarsRover targetPos={{ x: rover.position.x, y: rover.position.y } } onSelect={showInventory} />}
      </Canvas>

      {isInventoryOpen && (
        <InventoryPopup onClose={() => setInventoryOpen(false)} />
      )}
    </>
  );
};