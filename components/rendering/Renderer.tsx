import { useCycle, useTimeline, useUIHelper } from '@/lib/contexts';
import { MarsRover } from '@/Prefabs/MarsRover';
import { Position } from '@/types/RoverContextTypes';
import { useKeyboard } from '@/util/controlls';
import { PerspectiveCamera as PerspectiveCameraComponent } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { TILE_GAP } from './TileRenderer';
import { PerspectiveCamera } from 'three';
import DayNightDirectionalLights from './DayNightDirectonalLight';
import MapRenderer from './MapRenderer';
import { PathDisplayer } from './PathDisplayer';
import { MainParticle } from './Particles/MainParticles';
import { clampNum } from '@/util/math';
import { BottomPlane } from '@/Prefabs/BottomPlane';
import { lerp } from 'three/src/math/MathUtils.js';
import { BackgroundSky } from './BackgroundSky';

const CAM_HEIGHT = 60;

export const Renderer = () => {
  const { timeOfDay, player, t } = useCycle();
  const timeline = useTimeline();
  const keys = useKeyboard();

  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const hasInitializedCamera = useRef(false);
  const isSnappingRef = useRef(false);
  const directionRef = useRef<Position>({ x: 0, y: 0 });

  const GAP = TILE_GAP;
  const map = timeline.flavoredMap;
  const rover = timeline.rover;

  // A kamera mozgásához
  const [direction, setDirection] = useState<Position>({
    x: timeline.startingPoint.x * GAP,
    y: timeline.startingPoint.y * GAP + 110
  });

  const [fov, setFov] = useState(10);
  const {inventoryOpen} = useUIHelper();

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // Kamera kezdő pozícióját a start fölé állítjuk.
  useEffect(() => {
    if (hasInitializedCamera.current) return;
    if (timeline.startingPoint.x === 0 && timeline.startingPoint.y === 0) return;

    setDirection({
      x: timeline.startingPoint.x * GAP,
      y: timeline.startingPoint.y * GAP + 110
    });

    hasInitializedCamera.current = true;
  }, [timeline.startingPoint]);

  // Kamera mozgása, ha engedélyezve van a "snap to rover"
  const SMOOTH_SPEED_FACTOR = 0.04
  const FAST_SPEED_FACTOR = 0.25
  const RANGE_SPEED_FACTOR = 10
  useEffect(() => {
    if (!player.snapToggle) {
      isSnappingRef.current = false;
      return;
    }

    if (isSnappingRef.current) return;

    isSnappingRef.current = true;

    let lastTime = Date.now();
    let current = { ...direction };
    let animFrameId: number;

    const snapping = () => {
      const now = Date.now();
      lastTime = now;

      const targetX = rover.position.x * GAP;
      const targetY = rover.position.y * GAP + 110;

      const speedFactor = (Math.abs(targetX-current.x) > RANGE_SPEED_FACTOR) && (Math.abs(targetY-current.y) > RANGE_SPEED_FACTOR) ? FAST_SPEED_FACTOR : SMOOTH_SPEED_FACTOR;

      const next = {
        x: lerp(current.x, targetX, t.current * speedFactor),
        y: lerp(current.y, targetY, t.current * speedFactor)
      };

      if (Math.abs(next.x - targetX) < 0.05 && Math.abs(next.y - targetY) < 0.05) {
        setDirection({ x: targetX, y: targetY });
        cancelAnimationFrame(animFrameId);
        isSnappingRef.current = false;
        return;
      }

      current = next;
      setDirection(next);
      animFrameId = requestAnimationFrame(snapping);
    };

    animFrameId = requestAnimationFrame(snapping);

    return () => {
      cancelAnimationFrame(animFrameId);
      isSnappingRef.current = false;
    };
  }, [player.snapToggle, rover.position]);

  // Kamera mozgása, ha nincs engedélyezve a "snap to rover"
  useEffect(() => {
    if (inventoryOpen || player.snapToggle) return;

    let lastTime = Date.now();
    let animFrameId: number;

    const loop = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setDirection(prev => {
        let dx = 0;
        let dy = 0;
        let speed = 40;

        if (keys.current.shift) speed *= 2;
        if (keys.current.a) dx -= speed * delta;
        if (keys.current.d) dx += speed * delta;
        if (keys.current.w) dy -= speed * delta;
        if (keys.current.s) dy += speed * delta;

        if (!dx && !dy) return prev;

        return {
          x: clampNum(prev.x + dx, 0, 50 * GAP),
          y: clampNum(prev.y + dy, 92, 220)
        };
      });

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameId);
  }, [keys, inventoryOpen, player]);

  // Kamera látótere, görgővel változtatható.
  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      setFov(prev => Math.max(10, Math.min(13, prev + e.deltaY * 0.01)));
    };

    window.addEventListener('wheel', handleScroll);

    return () => {
      window.removeEventListener('wheel', handleScroll);
    };


  }, []);

  const camPos: [number, number, number] = [direction.x, CAM_HEIGHT, direction.y];


  return (
    <>
      <Canvas
        shadows
        style={{ width: '100vw', height: '100vh' }}
        className="bg-[#1b0000]"
      >

        <PerspectiveCameraComponent
          ref={cameraRef}
          makeDefault
          position={camPos}
          rotation={[-0.5, 0, 0]}
          fov={fov}
        />


        <ambientLight
          intensity={timeOfDay === 'day' ? 0.6 : 0.3}
          color={0xff6666}
        />


        <BackgroundSky />
        <ambientLight intensity={timeOfDay == 'day' ? 0.6 : 0.3} color={0xff6666} />

        <DayNightDirectionalLights />

        <directionalLight
          position={[0, 1, 1]}
          intensity={timeOfDay === 'day' ? 0.2 : 0.1}
          color={0xffffff}
        />

        <MapRenderer
          map={map!}
          camPos={camPos}
          rover={rover!}
          camH={CAM_HEIGHT}
        />

        <BottomPlane gap={GAP} />

        <PathDisplayer />

        {rover && <MarsRover />}

        <MainParticle camPosition={[camPos[0], 10, camPos[2]]} />
      </Canvas>
    </>
  );
};