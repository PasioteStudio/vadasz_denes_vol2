import BatteryDisplayer from "@/components/gui/BatteryDisplayer";
import CurrentAction from "@/components/gui/CurrentAction";
import DayNightCycleDisplayer from "@/components/gui/DayNightCycleDisplayer";
import LogDisplayer from "@/components/gui/LogDisplayer";
import TimeControlButtons from "@/components/gui/TimeControlButtons";
import MapExportButton from "./MapExportButton";
export function GUI() {
    return <div className="select-none">
        <div className="pointer-events-none absolute w-full h-full top-0 left-0 bg-radial from-transparent from-20% to-85% to-black/80"></div>
        <DayNightCycleDisplayer />
        <BatteryDisplayer />
        <TimeControlButtons />
        <LogDisplayer />
        <div className="fixed left-2 bottom-2 flex items-end justify-start gap-2">
            <CurrentAction />
            <MapExportButton />
        </div>
    </div>
}