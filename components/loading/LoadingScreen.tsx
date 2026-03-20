"use client"
import { useEffect, useRef, useState } from "react";

const TIPS = [
    "A Marson található legmagasabb hegy a Mount Everest háromszorosa.",
    "Egy év a Marson körülbelül 687 földi nap.",
    "A Mars felszínén a naplemente kéknek tűnik az atmoszféra miatt.",
    "A Mars gravitációja harmad akkora, mint a Földé.",
    "A marsi napot 'sol'-nak hívják.",
    "A Marson található jég, vékony felhők és még áradások jelei is felbukkantak.",
];
const TIP_INTERVAL = 4000;
const MIN_DISPLAY_TIME = 1500;

export default function LoadingScreen({ isLoading }: { isLoading: boolean }) {
    const [visible, setVisible] = useState(isLoading);
    const [fade, setFade] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [currentTipIndex, setTipIndex] = useState(Math.floor(Math.random() * (TIPS.length - 1)));
    const [tipFade, setTipFade] = useState(true);

    useEffect(() => {
        if (isLoading) {
            setVisible(true);
            setFade(true);
            setStartTime(Date.now());
        }
    }, [isLoading]);

    useEffect(() => {
        if (!isLoading && visible) {
            const elapsed = startTime ? Date.now() - startTime : 0;
            const remaining = Math.max(MIN_DISPLAY_TIME - elapsed, 0);

            const timeout = setTimeout(() => {
                setFade(false);
                const fadeDuration = 500;
                setTimeout(() => setVisible(false), fadeDuration);
            }, remaining);

            return () => clearTimeout(timeout);
        }
    }, [isLoading, visible, startTime]);

    useEffect(() => {
        if (!visible) return;

        const interval = setInterval(() => {
            setTipFade(false);

            setTimeout(() => {
                setTipIndex((prev) => {
                    const step = Math.floor(Math.random() * (TIPS.length - 1)) + 1;
                    return (prev + step) % TIPS.length;
                });
                setTipFade(true);
            }, 300);
        }, TIP_INTERVAL);

        return () => clearInterval(interval);
    }, [visible]);

    if (!visible) return null;

    return (
        <div className="fixed top-0 left-0 w-full h-full bg-black">
            <div
                className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"
                    }`}
            >
                <video
                    src="/videos/marsLoadingScreen.mp4"
                    className="w-full h-full object-cover scale-101 duration-200"
                    controls={false}
                    autoPlay
                    loop
                />
            </div>

            <div className="absolute bottom-10 w-max flex justify-center left-1/2 -translate-x-1/2 px-6 bg-black/30 rounded-md p-3">
                <p
                    className={`text-gray-100 text-center md:text-base max-w-xl transition-opacity duration-300 text-4xl ${tipFade ? "opacity-100" : "opacity-0"
                        }`}
                >
                    {TIPS[currentTipIndex]}
                </p>
            </div>
        </div>
    );
}