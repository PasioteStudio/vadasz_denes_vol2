"use client"
import { useState } from "react";
import Home from "./Home";
import InitialPage from "./InitialPage";
import { Field } from "@/types/MapTypes";

export default function App() {
    const [timeLimit, setTimeLimit] = useState(0);
    const [initialMap, setInitialMap] = useState<Field[][]>([]);
    return <>
        {timeLimit >= 48 && initialMap != undefined ?
            <Home initialMap={initialMap} timeLimit={timeLimit} />
            : <InitialPage setTimeLimit={setTimeLimit} setInitialMap={setInitialMap} />
        }
    </>


}
