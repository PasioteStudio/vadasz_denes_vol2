import { useCycle, useSnapshots } from "@/lib/contexts"

import { MarsRover } from "@/Prefabs/MarsRover";

import { Field } from "@/types/MapTypes";
import { Position } from "@/types/RoverContextTypes";
import { Tile, isOre } from "@/util/constants";
import { useKeyboard } from "@/util/controlls";
import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { TileRenderer } from "./TileRenderer";
import { clamp } from "three/tsl";
import { Controls } from "../gui/Controls";
import InventoryPopup from "../gui/InventoryPopup";
export const Renderer = () => {
    const { currentTick } = useCycle();
    const [path,setPath] = useState<number[]>([])
    //key input
    const [direction,setDirection] = useState<Position>({x:0,y:130})
    //scroll input
    const [fov,setFov] = useState<number>(10)
    const {timeOfDay} = useCycle();

    const map = useSnapshots().snapshots.get(currentTick)?.fields;
    const rover = useSnapshots().snapshots.get(currentTick)?.rover;
    //opening inventory on click
        const [isInventoryOpen, setInventoryOpen] = useState(false);
    const showInventory = () => {
    console.log("Inventory opened" + isInventoryOpen);
    setInventoryOpen(!isInventoryOpen);
  }

    //converting keyboard actions into direction changes
    const keys = useKeyboard();
    useEffect(() => {
        const speed = 1;
        let animFrameId: number;
        const loop = () => {
            setDirection(prev => {
                const next = { ...prev };
                if (keys.current.w) next.y -= speed;
                if (keys.current.s) next.y += speed;
                if (keys.current.a) next.x -= speed;
                if (keys.current.d) next.x += speed;
                return next;
            });
            animFrameId = requestAnimationFrame(loop);
        };

        animFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animFrameId);
    }, [keys]);
    //converting scroll input into fov changes
    useEffect(() => {
        const handleScroll = (e: WheelEvent) => {
            setFov(prev => Math.max(10, Math.min(13, prev + e.deltaY * 0.01)));
            
        }
        window.addEventListener("wheel", handleScroll);
        return () => window.removeEventListener("wheel", handleScroll);
    }, []);


    return <>
      <Canvas style={{ width: "100vw", height: "100vh" }}>
          {/* setting camera position based on rover position and direction */}
          
          <PerspectiveCamera
            makeDefault
            position={[
              direction.x + (rover?.position.x  ?? 0) * 2.5,
              70,
              direction.y + (rover?.position.y ?? 0) * 2.5
            ]}
            rotation={[-0.5, 0, 0]}
            fov={fov}  />

            <ambientLight intensity={1.3} color={timeOfDay ? 0xffffff : 0xaaaaaa} />
            <directionalLight intensity={1} position={[-2,2,-1]} color={0xffffff} />
            {map!.map((row: Field[], rowIndex: number) =>
            row.map((field, colIndex) => (
              <TileRenderer
                key={`${rowIndex}-${colIndex}`}
                tile={field.tile}
                x={colIndex}
                y={rowIndex}
              />
            ))
          )}
            {isInventoryOpen && <InventoryPopup />}
            <MarsRover targetPos={{x: rover!.position.x, y: rover!.position.y}} onSelect={showInventory}/>
      </Canvas>
    </>
}