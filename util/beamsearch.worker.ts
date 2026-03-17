import { Tile } from "@/lib/constants";
import { beamsolve } from "./beamsearch";

interface MakePathRequest {
  type: "makePath";
  iterations: number;
  map: Tile[][];
  complexity?: number;
}

self.onmessage = (event: MessageEvent) => {
  const data = event.data as MakePathRequest;
  if (data.type === "makePath") {
    try {
      // Híjuk meg a `makePath` funkciót, és küldjük vissza az eredményt kiszámítás után
      const result = beamsolve(data.iterations, data.map);
      self.postMessage({ type: "makePathResult", result });
    } catch (error) {
      console.error("Error in worker:", error instanceof Error ? error.message + error.stack : String(error));
      self.postMessage({ type: "error", error: error instanceof Error ? error.message : String(error) });
    }
  }
  //pusztítsuk el a `worker`-t, amikor befejezte
  self.close();
};