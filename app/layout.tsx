"use client"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UIHelperContext } from "@/lib/contexts";
import { useEffect, useState, useRef } from "react";

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
				onClick={(e) => { handleMouseMove(e) }}
			>
				<UIHelperContext.Provider value={{
					restingOpacity: 30,
					resting: UIisResting.isResting
				}}>
					{children}
				</UIHelperContext.Provider>
			</body>
		</html>
	);
}
