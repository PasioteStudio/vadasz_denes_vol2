"use client"
import { useState } from "react";

export default function RuntimeDisplayer({ runtime }: { runtime: number }) {
    const [isClosed, setClosed] = useState(false)
    if (runtime == 0 || isClosed) return;
    return <>
        <div className="w-3/12 min-w-md absolute top-1/2 left-1/2 -translate-1/2 bg-gray-950/90 rounded-2xl px-10 py-4 pb-10 border-[#ff4500] border">
            <h2 className="text-center text-[2vw] font-bold mb-5">Algoritmus</h2>

            <button className="absolute top-0 right-0 rounded-tr-2xl bg-[#ff4500] w-10 aspect-square rounded-bl-md cursor-pointer" onClick={() => { setClosed(true) }}>
                X
            </button>

            <p>Az algoritmus futási ideje: {runtime}ms</p>
        </div>
    </>
}