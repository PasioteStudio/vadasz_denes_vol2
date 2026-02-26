"use client"
import { makePath } from "@/util/algorithm";
import { generateMap, readMap } from "@/util/map";
import { useEffect, useState } from "react";
import {mapConstraints, ores, Tile} from "@/util/constants"
import { VectorField } from "@/util/vectormap";
import Home from "./Home";
import InitialPage from "./InitialPage";
import { Field } from "@/types/MapTypes";

export default function App() {
    const [timeLimit, setTimeLimit] = useState(49);
    const [initialMap, setInitialMap] = useState<Field[]>([]);
    return <>
        {timeLimit > 48 && initialMap != undefined ?
            <Home initialMap={initialMap} timeLimit={timeLimit} />
            : <InitialPage setTimeLimit={setTimeLimit} setInitialMap={setInitialMap} />
        }
    </>
}