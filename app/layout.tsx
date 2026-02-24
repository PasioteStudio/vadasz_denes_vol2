"use client"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CycleContext, MapSnapshotsContext, RoverContext } from "@/lib/contexts";
import { Item, Log, Position, RoverAction, RoverContextT } from "@/types/RoverContextTypes";
import { useState } from "react";
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
	const [currentAction, setCurrentAction] = useState<RoverAction>({action:"wait"});
	const [mapSnapShots, setMapSnapshots] = useState<Map<Number, MapSnapshot>>(new Map<Number, MapSnapshot>());

	const [cycle, setCycle] = useState<CycleContextT>({
		currentTick: 0,
		timeOfDay: "day",
		setTick: (t: number) => { setTickTo(t) }
	});

	const setTickTo = (t: number) => {
		// this will be the function that when called, checks if the tick exists as a key in the Map, then:
		// A) if it does, reverts there.
		// B) if it doesn't, calculates and logs, as this is a new action and spanshot
	};

	return (
		<html lang="hu">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black relative`}
			>
				<MapSnapshotsContext.Provider value={{
					snapshots: {
						get: mapSnapShots,
						set: (sh: Map<Number, MapSnapshot>) => {setMapSnapshots(sh)}
					}
				}}>


					<CycleContext.Provider value={{
						currentTick: cycle.currentTick,
						timeOfDay: cycle.timeOfDay,
						setTick: (t: number) => { cycle.setTick(t) },
					}}>
						<RoverContext.Provider value={{
							position: {
								get: position,
								set: (pos: Position) => { setPosition(pos) }
							},
							inventory: {
								get: inventory,
								set: (inv: Item[]) => { setInventory(inv) }
							},
							logs: {
								get: logs,
								set: (ls: Log[]) => { setLogs(ls) }
							},
							startingPosition: {
								get: startingPosition,
								set: (pos: Position) => { setStartingPosition(pos) }
							},
							energy: {
								get: energy,
								set: (e:number) => {setEnergy(e)},
							},
							currentAction: {
								get: currentAction,
								set: (a: RoverAction) => {setCurrentAction(a)}
							}
						}}>
							{children}
						</RoverContext.Provider>
					</CycleContext.Provider>
				</MapSnapshotsContext.Provider>
			</body>
		</html>
	);
}
