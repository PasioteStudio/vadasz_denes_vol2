import BatteryDisplayer from "@/components/gui/BatteryDisplayer";
import CurrentAction from "@/components/gui/CurrentAction";
import DayNightCycleDisplayer from "@/components/gui/DayNightCycleDisplayer";
import LogDisplayer from "@/components/gui/LogDisplayer";
import TimeControlButtons from "@/components/gui/TimeControlButtons";

export default function GUI(){
    return <>
    <DayNightCycleDisplayer />
    <BatteryDisplayer />
    <TimeControlButtons />
    {/* <LogDisplayer /> */}
    {/* 
    <CurrentAction /> */}
    </>
}