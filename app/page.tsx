"use client"
import { makePath } from "@/util/algorithm";
import Image from "next/image";
import { useEffect } from "react";

export default function Home() {

  useEffect(()=>{
    makePath([])
  },[])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
          <h1 className="text-4xl">Coming Soon...</h1>
      </main>
    </div>
  );
}
