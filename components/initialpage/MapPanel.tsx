import { Field } from "@/types/MapTypes";
import { isValidMap, readMap } from "@/util/map";
import { useEffect, useRef, useState } from "react";

export default function MapPanel(
    {
        current,
        setter
    }: {
        current: {
            option?: "upload" | "default",
            loadedMap?: Field[][]
        },
        setter: (option: "upload" | "default", loadedMap: Field[][]) => void
    }
) {
    const fileInput = useRef<HTMLInputElement | null>(null);
    const [error, setError] = useState("");

    const selectDefault = async () => {
        if (current.option === "default") return;
        const loadedMap: Field[][] = await readMap("/mars_map_50x50.csv");
        setter("default", loadedMap);
    };

    const setUpload = () => {
        fileInput.current?.click();
    };

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const loadedMap: Field[][] = await readMap(text, true);
        if(!isValidMap(loadedMap)) {
            setError("Helytelen tartalmú fájl.");
            return;
        }
        setter("upload", loadedMap);
        e.target.value = "";
    };

    useEffect(()=>{
        setError("")
    }, [current])

    return (
        <div className="flex flex-col gap-[1vh]">
            <input
                type="file"
                accept=".txt,.csv"
                ref={fileInput}
                className="hidden"
                onChange={handleFile}
            />

            <div className="flex items-center justify-start w-max gap-4">
                <button
                    onClick={setUpload}
                    className={`bg-buttonbg rounded-md border-2 border-buttonbg p-[1vw] w-max cursor-pointer hover:shadow-md shadow-black/30 duration-120
                    ${current.option === "upload" && "border-buttonicon"}`}
                >
                    <img src="/ui/filemap.png" className="w-[7vw] aspect-square" />
                </button>
                <p className="font-medium text-[2vw]/[1.1]">térkép <br /> feltöltése</p>
            </div>

            <div className="flex items-center justify-start w-max gap-4">
                <button
                    onClick={selectDefault}
                    className={`bg-buttonbg rounded-md border-2 border-buttonbg p-[1vw] w-max cursor-pointer hover:shadow-md shadow-black/30 duration-120
                    ${current.option === "default" && "border-buttonicon"}`}
                >
                    <img src="/ui/map.png" className="w-[4vw] aspect-square" />
                </button>
                <p className="font-thin text-[1vw]/[1.2] max-w-[7.7vw]">vagy használja az alap térképet</p>
            </div>

            <p className="text-red-500">{error}</p>
        </div>
    );
}
