"use client"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CycleContext, MapSnapshotsContext, RoverContext, UIHelperContext } from "@/lib/contexts";
import { Item, Log, Position, RoverAction, RoverContextT } from "@/types/RoverContextTypes";
import { useEffect, useState, useRef } from "react";
import { CycleContextT } from "@/types/CycleContextTypes";
import { MapSnapshot } from "@/types/MapTypes";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});


export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
	const [startingPosition, setStartingPosition] = useState<Position>({ x: 0, y: 0 });
	const [inventory, setInventory] = useState<Item[]>([]);
	const [logs, setLogs] = useState<Log[]>([]);
	const [energy, setEnergy] = useState(100);
	const [currentAction, setCurrentAction] = useState<RoverAction>({ action: "wait" });
	const [mapSnapShots, setMapSnapshots] = useState<Map<Number, MapSnapshot>>(new Map<Number, MapSnapshot>());
	const [UIisResting, setUIResting] = useState({
		isResting: false,
	});
	const lastMoveRef = useRef<number>(Date.now());

	const [cycle, setCycle] = useState<Omit<CycleContextT, "player">>({
		currentTick: 0,
		timeOfDay: "day",
		setTick: (t: number) => { setTickTo(t) },
	});
	const [player, setPlayer] = useState({
		speed: 1 as 1 | 2,
		playing: "paused" as "paused" | "playing",
	});

	const setTickTo = (t: number) => {
		// after we run the algo, we'll generate the snapshots there. now all we need is to load them when requested
		try { //TODO check if snapshot for tick exists
			setCycle(p => {
				return {
					...p,
					currentTick: t,
					timeOfDay: t%48 > 32 ? "night" : "day"
				}
			})
			loadSnapshot(mapSnapShots.get(t)!);
		} catch {
			console.log("fuck off, cunt") //TODO handle error or smthng
		}
	};
	const handleMouseMove = (e: React.MouseEvent<HTMLBodyElement>) => {
		lastMoveRef.current = Date.now();
		setUIResting({
			isResting: false,
		})
	}
	const loadSnapshot = (snapshot: MapSnapshot) => {
		// reflecting state of map happens in the page.tsx, where it will be read from the snapshots context with the tick as the key from the cycle context.
		// load stuff for the rover
		const r = snapshot.rover;
		setPosition(r.position);
		setInventory(r.inventory);
		setCurrentAction(r.currentAction);
		setLogs(r.logs);
		setEnergy(r.energy);
	}

	useEffect(() => {
		const interval = setInterval(() => {
			const now = Date.now();
			if (now - lastMoveRef.current > 3000) {
				setUIResting({
					isResting: true,
				})
			}
		}, 500)
		return () => { clearInterval(interval) }
	}, [])
	useEffect( () => { //INIT: start the algorithm and create snapshots. for now. TODO: get input for stuff... maybe this should be on the main page instead of the layout... maybe everything should be moved..
		//startAlgorithm(snapshotsSetter:setMapSnapshots);
	}, [])

	return (
		<html lang="hu">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black relative min-h-screen w-full`}
				onMouseMove={(e) => { handleMouseMove(e) }}
			>
				<UIHelperContext.Provider value={{
					restingOpacity: 30,
					resting: UIisResting.isResting
				}}>
					<MapSnapshotsContext.Provider value={{
						snapshots: mapSnapShots
					}}>
						<CycleContext.Provider value={{
							currentTick: cycle.currentTick,
							timeOfDay: cycle.timeOfDay,
							setTick: (t: number) => { cycle.setTick(t) },
							player: {
								playing: player.playing,
								speed: player.speed,
								setPlaying: (state) => { setPlayer(p => { return { ...p, playing: state } }) },
								setSpeed: (speed) => { setPlayer(p => { return { ...p, speed: speed } }) }
							}
						}}>
							<RoverContext.Provider value={{
								position: position,
								inventory: inventory,
								logs: logs,
								startingPosition: startingPosition,
								energy: energy,
								currentAction: currentAction,
							}}>
								{children}
							</RoverContext.Provider>
						</CycleContext.Provider>
					</MapSnapshotsContext.Provider>
				</UIHelperContext.Provider>
			</body>
		</html>
	);
}
