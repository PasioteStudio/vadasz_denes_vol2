"use client"
import { useEffect, useState } from "react";

export default function LoadingScreen({ isLoading }: { isLoading: boolean }) {
    const [visible, setVisible] = useState(isLoading);
    const [fade, setFade] = useState(false);
    const MIN_DISPLAY_TIME = 1500; // Ezzel elkerüljük a hirtelen felvillanást és javítjuk a felhasználói élményt.
    const [startTime, setStartTime] = useState<number | null>(null);

    useEffect(() => {
        if (isLoading) {
            setVisible(true);
            setFade(true);
            setStartTime(Date.now());
        }
    }, [isLoading]);

    // Ha a töltésnek vége
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
                ></video>
            </div>
        </div>
    );
}