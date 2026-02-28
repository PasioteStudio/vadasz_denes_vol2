import { useEffect } from "react";
import { Vector3 } from "three";

 export function useWASD(onMove: (direction: Vector3) => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "w":
          onMove(new Vector3(0, 0, -1));
          break;
        case "s":
          onMove(new Vector3(0, 0, 1));
          break;
        case "a":
          onMove(new Vector3(-1, 0, 0));
          break;
        case "d":
          onMove(new Vector3(1, 0, 0));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onMove]);
}