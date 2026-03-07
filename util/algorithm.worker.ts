// util/algorithm.worker.ts
// Web Worker for makePath offloading
import { makePath } from "./algorithm";
import { Tile } from "./constants";

// Types for incoming messages
interface MakePathRequest {
  type: "makePath";
  iterations: number;
  map: Tile[][]; // Should match Tile[][], but use 'any' for serialization
  complexity?: number;
}

self.onmessage = (event: MessageEvent) => {
  const data = event.data as MakePathRequest;
  if (data.type === "makePath") {
    try {
      // Call makePath and post result back
      const result = makePath(data.iterations, data.map, data.complexity);
      self.postMessage({ type: "makePathResult", result });
    } catch (error) {
      self.postMessage({ type: "error", error: error instanceof Error ? error.message : String(error) });
    }
  }
};
