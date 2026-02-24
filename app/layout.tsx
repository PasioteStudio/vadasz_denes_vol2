"use client"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RoverContext } from "@/lib/contexts";
import { Item, Log, Position, RoverContextT } from "@/types/RoverContextTypes";
import { useState } from "react";

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
  const [position, setPosition] = useState<Position>({x:0,y:0});
  const [inventory, setInventory] = useState<Item[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  
  return (
    <html lang="hu">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black relative`}
      >
        <RoverContext.Provider value={{
          position: {
            get: position,
            set: (pos:Position) => {setPosition(pos)}
          },
          inventory: {
            get: inventory,
            set: (inv: Item[]) => {setInventory(inv)}
          },
          logs: {
            get: logs,
            set: (ls: Log[]) => {setLogs(ls)}
          },
        }}>
          {children}
        </RoverContext.Provider>
      </body>
    </html>
  );
}
