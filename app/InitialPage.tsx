"use client"
import MapPanel from "@/components/initialpage/MapPanel";
import TimeLimitPanel from "@/components/initialpage/TimeLimitPanel";
import { StaticRover } from "@/Prefabs/static/staticRover";
import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { Terrain } from "@/Prefabs/static/Terrain";
import { Tile } from "@/lib/constants";
import { ParticleManager } from "@/components/rendering/Particles/ParticleManager";
import Sky from "@/components/rendering/Sky";
import { Vector3 } from "three";

export default function InitialPage({ setTimeLimit, setInitialMap }: { setTimeLimit: (limit: number) => void, setInitialMap: (tiles: Tile[][]) => void }) {
    const [delayDone, setDelayDone] = useState(false);

    const [selectedMapOption, setMapOption] = useState<"upload" | "default" | "random">();
    const [loadedMap, setLoadedMap] = useState<Tile[][]>();
    const [selectedTimeLimit, setSelectedTimeLimit] = useState<number>(48);
    const [validInputs, setValidInputs] = useState(false);
    const [currentPanel, setPanel] = useState<"map" | "time">("map");
    const [visitedTimePanel, setVisitedTimePanel] = useState(false);

    const panels = {
        "map": <MapPanel current={{
            loadedMap: loadedMap,
            option: selectedMapOption,
        }} setter={(option: "upload" | "default" | "random", loadedMap: Tile[][]) => {
            setMapOption(option);
            setLoadedMap(loadedMap);
        }} />,
        "time": <TimeLimitPanel current={selectedTimeLimit} setter={setSelectedTimeLimit} />,
    };

    useEffect(() => {
        setValidInputs(loadedMap != undefined && loadedMap.length > 0 && selectedTimeLimit >= 48 && visitedTimePanel)
    }, [loadedMap, selectedTimeLimit, visitedTimePanel])

    const finalizeInputs = () => {
        setTimeLimit(selectedTimeLimit);
        setInitialMap(loadedMap!);
    }

    useEffect(() => {
        const TO = setTimeout(() => {
            setDelayDone(true);
        }, 1000)

        return () => { clearTimeout(TO) }
    }, [])
    return <>
        <Canvas style={{ width: '100vw', height: '100vh' }} camera={
            {
                position: [-7, 2, -11],
                fov: 50,
                rotation: [-0.2, 0, 0]
            }} className={`bg-[#351818]`} shadows>

            <directionalLight intensity={1} position={[-2,5,7]} color={0xcd5c5c} />
            <directionalLight intensity={0.6} position={[-2,5,7]} color={0xffffff} castShadow shadow-bias={0.0001} shadow-normalBias={0.000001} />
            <ambientLight intensity={1} color={0x420D09} />
           
            <StaticRover rotation={[0.1, 3.4, -0.1]} position={[-3.3, -0.1, -20]} scale={0.8} />

            <Terrain receiveShadow />
            {/* TODO: Gálati, majd ha a pálya megoldhatatlan, akkor ez legyen true */}
            <ParticleManager blowUp={false} />
            <Sky />
        </Canvas>
        <div className="w-full h-screen flex items-center justify-left absolute top-0 left-0 z-999 overflow-hidden ">
            <div className="w-1/2 h-full flex flex-col items-center py-[10vh] font-bold relative">
                <h1 className={`text-center text-[5.5vw] bg-linear-to-r from-buttonicon to-misc1 bg-clip-text text-transparent translate-y-[200%] duration-500 ${delayDone && "translate-y-0!"}`}>The Rover v1.0</h1>
                <div className={`w-9/12 grow py-[3vh] duration-500 opacity-0 translate-y-3/12 ${delayDone && "opacity-100 translate-y-0!"}`}>
                    {panels[currentPanel]}
                </div>


                <div className={`flex items-center gap-[1vw] justify-start w-9/12 duration-500 opacity-0 translate-y-full ${delayDone && "opacity-100 translate-y-0!"}`}>

                    <button className={`cursor-pointer disabled:cursor-no-drop bg-buttonbg px-[3vw] py-[1.2vw] group rounded-md`}
                        disabled={currentPanel == "map"} onClick={() => { setPanel("map") }}>
                        <img src={"/ui/arrow.svg"} alt="<-" className="group-disabled:opacity-40 rotate-180 w-[1.5vw] aspect-square" />
                    </button>

                    <button className={`cursor-pointer disabled:cursor-no-drop bg-buttonbg px-[3vw] py-[1.2vw] group rounded-md`}
                        disabled={currentPanel == "time"} onClick={() => { setPanel("time"); setVisitedTimePanel(true) }}>
                        <img src={"/ui/arrow.svg"} alt="<-" className="origin-center group-disabled:opacity-40 w-[1.5vw] aspect-square" />
                    </button>

                    <button className={`cursor-pointer disabled:cursor-no-drop bg-buttonbg px-[3vw] py-[1.2vw] group rounded-md font-medium text-[1vw] group`}
                        disabled={!validInputs} onClick={finalizeInputs}>
                        <span className="group-disabled:opacity-40">Indítás</span>
                    </button>
                    <div className="ml-[1vw]">
                        <p className={`${loadedMap != undefined ? "text-green-500" : "text-white"} font-medium text-[1vw]`}>1. Térkép</p>
                        <p className={`${selectedTimeLimit >= 48 && visitedTimePanel ? "text-green-500" : "text-white"} font-medium text-[1vw]`}>2. Idő</p>
                    </div>
                </div>
            </div>
        </div>
    </>
}