import { useCycle, useSnapshots } from "@/lib/contexts"

import { MarsRover } from "@/Prefabs/MarsRover";

import { Field } from "@/types/MapTypes";
import { Position } from "@/types/RoverContextTypes";
import { Tile, isOre } from "@/util/constants";
import { useKeyboard } from "@/util/controlls";
import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { TileRenderer, TILE_GAP } from "./TileRenderer";
import { Controls } from "../gui/Controls";
import InventoryPopup from "../gui/InventoryPopup";
import { is } from "@react-three/fiber/dist/declarations/src/core/utils";
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


    const GAP = TILE_GAP; // ennél mindeképp a const-ot használjuk a másik componentben pls

    const VISIBLE_ROWS = 37;
    const VISIBLE_COLS = 30;
    const radiusRows = Math.floor(VISIBLE_ROWS / 2); 
    const radiusCols = Math.floor(VISIBLE_COLS / 2);
    const rxOffset = radiusCols/2;
    const ryOffset = radiusRows/2;

    function clampNum(v: number, min: number, max: number) {
        return Math.min(max, Math.max(min, v));
    }

    const camTile = useMemo(() => {
        const camXraw = Math.round((direction.x + (rover?.position.x ?? 0) * GAP) / GAP);

        // ha a közeljövőben mégegyszer egy offset miatt cseszek el egy teljes órát, csak mert nem jutott eszembe, akkor egy bizonyos osztrák festő nyomdokaiba lépek.
        const camYraw = Math.round((direction.y + (rover?.position.y ?? 0) * GAP) / GAP) - 50;
        if (!map) return { x: camXraw, y: camYraw };

        const rows = map.length;
        const cols = map[0]?.length || 0;
        const camX = clampNum(camXraw, rxOffset, cols - 1 - rxOffset);
        const camY = clampNum(camYraw, ryOffset, rows - 1 - ryOffset);

        return { x: camX, y: camY };
    }, [direction, rover]);

    const bounds = useMemo(() => {
        if (!map) return null;
        const rows = map.length;
        const cols = map[0]?.length || 0;
        const minRow = clampNum(camTile.y - radiusRows, 0, rows - 1);
        const maxRow = clampNum(camTile.y + radiusRows, 0, rows - 1);
        const minCol = clampNum(camTile.x - radiusCols, 0, cols - 1);
        const maxCol = clampNum(camTile.x + radiusCols, 0, cols - 1);
        return { minRow, maxRow, minCol, maxCol };
    }, [camTile]);

    const keys = useKeyboard();
    useEffect(() => {
      if(isInventoryOpen) return;
        const speed = 1;
        let animFrameId: number;
        const loop = () => {
          
            setDirection(prev => {
                let dx = 0;
                let dy = 0;
                if (keys.current.w) dy -= speed;
                if (keys.current.s) dy += speed;
                if (keys.current.a) dx -= speed;
                if (keys.current.d) dx += speed;
                if (dx === 0 && dy === 0) {
                    return prev;
                }
                return { x: prev.x + dx, y: prev.y + dy };
            });
            animFrameId = requestAnimationFrame(loop);
        };

        animFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animFrameId);

    }, [keys, isInventoryOpen]);
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
          <PerspectiveCamera
            makeDefault
            position={[
              direction.x + (rover?.position.x  ?? 0) * 2.5,
              70,
              direction.y + (rover?.position.y ?? 0) * 2.5
            ]}
            rotation={[-0.5, 0, 0]}
            fov={fov}  />

            <ambientLight intensity={timeOfDay == "day" ? 1 : 0.5} color={0xffaaaa} />
            <directionalLight intensity={timeOfDay == "day" ? 1 : 0} position={[-2,2,-1]} color={0xffffff} />
            <directionalLight intensity={timeOfDay == "night" ? 1 : 0} position={[-2,2,-1]} color={0x0000ff} />

            {map && bounds &&
              map.map((row: Field[], rowIndex: number) => {
                if (rowIndex < bounds.minRow || rowIndex > bounds.maxRow) return null;
                return row.map((field, colIndex) => {
                  if (colIndex < bounds.minCol || colIndex > bounds.maxCol) return null;
                  return (
                    <TileRenderer
                      key={`${rowIndex}-${colIndex}`}
                      tile={field.tile}
                      x={colIndex}
                      y={rowIndex}
                    />
                  );
                });
              })}
            <MarsRover targetPos={{x: rover!.position.x, y: rover!.position.y}}/>
      </Canvas>
      {isInventoryOpen && <InventoryPopup />}
    </>
}