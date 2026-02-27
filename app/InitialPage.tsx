"use client"
import MapPanel from "@/components/initialpage/MapPanel";
import TimeLimitPanel from "@/components/initialpage/TimeLimitPanel";
import { StaticRover } from "@/Prefabs/static/staticRover";
import { Field } from "@/types/MapTypes";
import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { Euler, Vector3 } from "three";

export default function InitialPage({ setTimeLimit, setInitialMap }: { setTimeLimit: (limit: number) => void, setInitialMap: (fields: Field[][]) => void }) {
    const [delayDone, setDelayDone] = useState(false);

    const [selectedMapOption, setMapOption] = useState<"upload" | "default">();
    const [loadedMap, setLoadedMap] = useState<Field[][]>();
    const [selectedTimeLimit, setSelectedTimeLimit] = useState<number>(0);
    const [validInputs, setValidInputs] = useState(false);
    const [currentPanel, setPanel] = useState<"map" | "time">("map");

    const panels = {
        "map": <MapPanel current={{
            loadedMap: loadedMap,
            option: selectedMapOption,
        }} setter={(option: "upload" | "default", loadedMap: Field[][]) => {
            setMapOption(option);
            setLoadedMap(loadedMap);
        }} />,
        "time": <TimeLimitPanel current={selectedTimeLimit} setter={setSelectedTimeLimit} />,
    };

    useEffect(()=>{
        setValidInputs(loadedMap != undefined && loadedMap.length > 0 && selectedTimeLimit >= 48)
    }, [loadedMap, selectedTimeLimit])

    const finalizeInputs = ()=>{
        setTimeLimit(selectedTimeLimit);
        setInitialMap(loadedMap!);
    }

    useEffect(() => {
        const TO = setTimeout(() => {
            setDelayDone(true);
        }, 2000)

        return () => { clearTimeout(TO) }
    }, [])
    return <>
        <Canvas style={{ width: '100vw', height: '100vh' }} camera={
            {
                position: [0, 0, 0],
                fov: 50,
                rotation: new Euler(0, 0, 0)
            }} className={`bg-[#342A2A]`}>

            <ambientLight intensity={1.3} />
            <spotLight position={[0, 64, 32]} />

            <StaticRover rotation={new Euler(0.5, 10, 0)} position={[1.5, 0, -4]} scale={0.6} />
        </Canvas>
        <div className="w-full h-screen flex items-center justify-left absolute top-0 left-0 z-999">
            <div className="w-1/2 h-full flex flex-col items-center py-[10vh] font-bold relative">
                <h1 className="text-center text-[5.5vw] bg-linear-to-r from-buttonicon to-misc1 bg-clip-text text-transparent">The Rover v1.0</h1>
                <div className="w-9/12 grow py-[3vh]">
                    {panels[currentPanel]}
                </div>


                <div className="flex items-center gap-[1vw] justify-start w-9/12">

                    <button className={`cursor-pointer disabled:cursor-no-drop bg-buttonbg px-[3vw] py-[1.2vw] group rounded-md`}
                        disabled={currentPanel == "map"} onClick={() => { setPanel("map") }}>
                        <img src={"/ui/arrow.svg"} alt="<-" className="group-disabled:opacity-40 rotate-180 w-[1.5vw] aspect-square" />
                    </button>

                    <button className={`cursor-pointer disabled:cursor-no-drop bg-buttonbg px-[3vw] py-[1.2vw] group rounded-md`}
                        disabled={currentPanel == "time"} onClick={() => { setPanel("time") }}>
                        <img src={"/ui/arrow.svg"} alt="<-" className="origin-center group-disabled:opacity-40 w-[1.5vw] aspect-square" />
                    </button>

                    <button className={`cursor-pointer disabled:cursor-no-drop bg-buttonbg px-[3vw] py-[1.2vw] group rounded-md font-medium text-[1vw] group`}
                        disabled={!validInputs} onClick={finalizeInputs}>
                        <span className="group-disabled:opacity-40">Indítás</span>
                    </button>
                    <div className="ml-[1vw]">
                        <p className={`${loadedMap != undefined ? "text-green-500": "text-white"} font-medium text-[1vw]`}>1. Térkép</p>
                        <p className={`${selectedTimeLimit >= 48 ? "text-green-500": "text-white"} font-medium text-[1vw]`}>2. Idő</p>
                    </div>
                </div>
            </div>
        </div>
    </>
}