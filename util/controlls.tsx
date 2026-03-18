import { useEffect, useRef } from "react";

/**
 * Billentyűzet listener
 * @returns RefObject a figyelt gombokkal, booleanként (lenyomva?)
 */
export function useKeyboard() {
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = true;
      }
    };

    const up = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false;
      }
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return keys;
}