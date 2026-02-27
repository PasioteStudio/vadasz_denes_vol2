"use client"
import { useEffect, useState } from "react"

export default function TimeLimitPanel({current, setter}: {current: number, setter: (ticks: number) => void}) {
    const [inputValue, setInpVal] = useState<number | "">(0);

    useEffect(()=>{
        setter(inputValue == "" ? 0 : inputValue*2)
    }, [inputValue])

    return <div className="flex flex-col items-start justify-start">
        <h2 className="text-[2vw] font-medium">Rendelkezésre álló idő (óra)</h2>
        <input type="text" min={24} className="bg-buttonbg text-buttonicon focus:outline-0 py-[0.3vw] px-[1vw] text-[2vw] rounded-md w-[16vw]" value={inputValue} onChange={(e) => {
            try{
                const newVal = parseInt(e.target.value);
                if(Number.isNaN(newVal)){
                    setInpVal("");
                    return;
                }
                setInpVal(newVal);
            }catch{}
        }} />
        <p className="text-[1vw] font-medium mt-[1vh]">Minimum 24.</p>
    </div>
}