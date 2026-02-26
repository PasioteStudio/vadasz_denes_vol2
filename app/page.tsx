"use client"
import { useState } from "react";
import Home from "./Home";
import InitialPage from "./InitialPage";
import { Tile } from "@/util/constants";

export default function App() {
    const [timeLimit, setTimeLimit] = useState(49);
    const [initialMap, setInitialMap] = useState<Tile[]>([]);
    return <>
        {timeLimit > 48 && initialMap != undefined ?
            <Home initialMap={initialMap} timeLimit={timeLimit} />
            : <InitialPage setTimeLimit={setTimeLimit} setInitialMap={setInitialMap} />
        }
    </>
}