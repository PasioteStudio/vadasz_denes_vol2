import { useCycle, useSnapshots } from "@/lib/contexts"
import { Field } from "@/types/MapTypes";
import { Position } from "@/types/RoverContextTypes";
import { Tile, isOre } from "@/util/constants";
import { useEffect, useMemo, useState } from "react";
import * as THREE from 'three';

export const Renderer = () => {
    const { currentTick } = useCycle();
    const [path,setPath] = useState<number[]>([])
    const map = useSnapshots().snapshots.get(currentTick)?.fields;


    useEffect(()=>{
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        50,window.innerWidth / window.innerHeight,
        1,
        1000
      );
      camera.position.z = 96;

      const canvas = document.getElementById("canvas")!;
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      ambientLight.castShadow = true;
      scene.add(ambientLight);

      const boxGeometry = new THREE.BoxGeometry(16,16,16);
      const boxMaterial = new THREE.MeshNormalMaterial();
      const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
      scene.add(boxMesh) 

      const animate = () => {
        boxMesh.rotation.x += 0.01;
        boxMesh.rotation.y += 0.01;

        renderer.render(scene, camera)
        window.requestAnimationFrame(animate);
      }
      animate()
    },[])
    
    // return <div className="w-full h-full flex flex-col items-center justify-center py-100 ">
    //       <table className="mx-auto">
    //         <thead>
    //           <tr>
    //             <th></th>
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
      <canvas id="canvas"></canvas>
    </>
}