import { useCycle, useTimeline } from '@/lib/contexts';
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

import { ParticleManager } from './Particles/ParticleManager';



// Layout / rendering constants
const CAM_HEIGHT = 60;

export const Renderer = () => {
  const { timeOfDay } = useCycle();
  const timeline = useTimeline();

  const cameraRef = useRef<PerspectiveCamera | null>(null)
  const GAP = TILE_GAP;

  const [direction, setDirection] = useState<Position>({
    x: timeline.startingPoint.x * GAP,
    y: timeline.startingPoint.y * GAP + 110,
  });
  const hasInitializedCamera = useRef(false);
  useEffect(() => {
    if (hasInitializedCamera.current) return;
    if (timeline.startingPoint.x === 0 && timeline.startingPoint.y === 0) return;
    setDirection({
      x: timeline.startingPoint.x * GAP,
      y: timeline.startingPoint.y * GAP + 110,
    });
    hasInitializedCamera.current = true;
  }, [timeline.startingPoint]);
  const [fov, setFov] = useState<number>(10);
  const [isInventoryOpen, setInventoryOpen] = useState(false);
  const [cameraRotationEnabled, setCamRotEnabled] = useState(false);

  const map = timeline.map;
  const rover = timeline.rover;

  const jumpToRoverOnMove = false;
  //snap to rover
  useEffect(() => {
    if (!jumpToRoverOnMove) return;
    setDirection({
      x: rover.position.x * GAP,
      y: rover.position.y * GAP,
    })
  }, [rover])

  const keys = useKeyboard();
  const directionRef = useRef<Position>(direction);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  //LOOK AROUND
  const [yaw, setYaw] = useState(0);
  const [pitch, setPitch] = useState(-0.5);
  const isDragging = useRef(false);
  const lastMouse = useRef<{ x: number, y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!cameraRotationEnabled) return;
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      setYaw((prev) => prev - dx * 0.005);
      setPitch((prev) => {
        const next = prev - dy * 0.005;
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
    const speed = 40;
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
      if (e.key.toLowerCase() == "f") setCamRotEnabled(p => !p);
    }
    window.addEventListener('wheel', handleScroll);
    window.addEventListener('keydown', handleCameraToggle);
    return () => {
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('keydown', handleCameraToggle);
    };
  }, []);


  const camPos: [number, number, number] = [direction.x, CAM_HEIGHT, direction.y];


  return (
    <>
      <Canvas style={{ width: '100vw', height: '100vh' }} shadows>
        <PerspectiveCameraComponent
          ref={cameraRef}
          makeDefault
          position={camPos}
          rotation={[pitch, yaw, 0]}
          fov={fov}
        />

        <ambientLight intensity={timeOfDay == 'day' ? 1 : 0.5} color={0xff6666} />
        <DayNightDirectionalLights />

        <MapRenderer map={map!} camPos={camPos} rover={rover!} camH={CAM_HEIGHT} />

        {rover && <MarsRover onSelect={showInventory} />}

        <ParticleManager />



      </Canvas>

      {isInventoryOpen && (
        <InventoryPopup onClose={() => setInventoryOpen(false)} />
      )}
    </>
  );
};