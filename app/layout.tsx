"use client"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CycleContext, MapSnapshotsContext, UIHelperContext } from "@/lib/contexts";
import { Item, Log, Position, RoverAction, RoverT } from "@/types/RoverContextTypes";
import { useEffect, useState, useRef } from "react";
import { CycleContextT } from "@/types/CycleContextTypes";
import { MapSnapshot } from "@/types/MapTypes";
import { Tile } from "@/util/constants";
import Home from "./Home";
import InitialPage from "./InitialPage";

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
	const [timeLimit, setTimeLimit] = useState(0);
	const [initialMap, setInitialMap] = useState<Tile[]>();

	const [UIisResting, setUIResting] = useState({
		isResting: false,
	});
	const lastMoveRef = useRef<number>(Date.now());


	const handleMouseMove = (e: React.MouseEvent<HTMLBodyElement>) => {
		lastMoveRef.current = Date.now();
		setUIResting({
			isResting: false,
		})
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
					{timeLimit != 0 && initialMap != undefined ?
						<Home initialMap={initialMap} timeLimit={timeLimit} />
						: <InitialPage setTimeLimit={setTimeLimit} setInitialMap={setInitialMap} />
					}
				</UIHelperContext.Provider>
			</body>
		</html>
	);
}
