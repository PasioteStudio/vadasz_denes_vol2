import { useCycle, useSnapshots } from "@/lib/contexts"
import { BarrierTile } from "@/Prefabs/BarrierTile";
import { MarsRover } from "@/Prefabs/MarsRover";
import { NormalTile } from "@/Prefabs/NormalTile";
import { Field } from "@/types/MapTypes";
import { Position } from "@/types/RoverContextTypes";
import { Tile, isOre } from "@/util/constants";
import { useKeyboard } from "@/util/controlls";
import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";


export const Renderer = () => {
    const { currentTick } = useCycle();
    const [path,setPath] = useState<number[]>([])
    //key input
    const [direction,setDirection] = useState<Position>({x:0,y:0})
    //scroll input
    const [fov,setFov] = useState<number>(50)

    const map = useSnapshots().snapshots.get(currentTick)?.fields;
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
            setFov(prev => Math.max(10, Math.min(100, prev + e.deltaY * 0.1)));
        }
        window.addEventListener("wheel", handleScroll);
        return () => window.removeEventListener("wheel", handleScroll);
    }, []);
    //             {map!.map((row:Field[],id:number)=>{
    //               return <th key={id} className="text-xs">{id}</th>
    //             })}
    //           </tr>
    //         </thead>
    //         <tbody>
    //           {map!.map((row:Field[],id:number)=>{
    //             return <tr key={id}>
    //               <td><p>{id}</p></td>
    //               {row.map((field,idx)=>{
    //                 return <td aria-valuemin={idx} aria-valuemax={id} className={`w-5 border border-collapse ${field.tile == Tile.Start ? "bg-yellow-700" : (field.tile == Tile.Empty ? "bg-gray-900" : "")}`} key={idx}>

    //                   <p className="w-full h-min text-center aspect-square">{field.tile == Tile.Obstacle ? "🟥" : (isOre(field.tile) ? "❤" : (field.tile == Tile.Start ? "🏳️" : ""))}</p>
                      
    //                 </td>
    //               })}
    //             </tr>
    //           })}
    //         </tbody>
    //       </table>
    // </div>

    return <>
      <Canvas style={{ width: "100vw", height: "100vh" }}>
        
          <PerspectiveCamera
            makeDefault
            position={[direction.x, 70, direction.y+100]}
            rotation={[-0.5, 0, 0]}
            fov={fov}  />

            <ambientLight intensity={1.3} />
            <spotLight position={[0, 64, 32]} />
            
            <MarsRover moveForward={10}/>

          <NormalTile/>
          <BarrierTile/>
      </Canvas>
    </>
}