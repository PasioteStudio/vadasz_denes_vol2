export interface WeightPoint {
  x: number;
  y: number;
  weight: number;
}

export interface VectorField {
  x: number;
  y: number;
  vector: { dx: number; dy: number };  // direction and magnitude
  magnitude: number;
  endPoint:{x?:number,y?:number,relative_x:number,relative_y:number}
  angleRad?: number;
  angleDeg360?: number;
  angleDegSigned?: number;
  angleDegAcute?: number;
}

// Precompute octant-to-step map once (not per iteration)
const octantToStep: { [k: number]: { dx: number; dy: number } } = {
  0: { dx: 1, dy: 0 },
  1: { dx: 1, dy: -1 },
  2: { dx: 0, dy: -1 },
  3: { dx: -1, dy: -1 },
  4: { dx: -1, dy: 0 },
  5: { dx: -1, dy: 1 },
  6: { dx: 0, dy: 1 },
  7: { dx: 1, dy: 1 },
};

export function createVectorMapFromWeights(
  width: number,
  height: number,
  weightPoints: WeightPoint[]
): VectorField[][] {
  const vectorMap: VectorField[][] = Array(height)
    .fill(null)
    .map(() => Array(width));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let totalInfluence = 0;
      let weightedPosX = 0;
      let weightedPosY = 0;
      let totalDx = 0;
      let totalDy = 0;

      // Calculate influence from each weight point and accumulate a weighted center
      weightPoints.forEach((point) => {
        const dx = point.x - x;
        const dy = point.y - y;
        const distance = Math.hypot(dx, dy);
        const safeDist = Math.max(distance, 1e-6); // avoid division by zero, but not bias small distances too much
        const influence = point.weight / (safeDist * safeDist); // inverse square law

        weightedPosX += point.x * influence;
        weightedPosY += point.y * influence;
        totalDx += (dx / safeDist) * influence;
        totalDy += (dy / safeDist) * influence;
        totalInfluence += influence;
      });

      const inv = totalInfluence === 0 ? 0 : 1 / totalInfluence;

      //const centerX = totalInfluence === 0 ? x : weightedPosX / totalInfluence;
      //const centerY = totalInfluence === 0 ? y : weightedPosY / totalInfluence;

      const vx = totalDx * inv;
      const vy = totalDy * inv;
      const magnitudeFinal = Math.hypot(vx, vy);

      // angles: invert vy for screen coords where +y is downward so 0deg = right, 90deg = up
      const angleDeg360 = magnitudeFinal === 0 ? 0 : ((Math.atan2(-vy, vx) * 180) / Math.PI + 360) % 360; // 0..360

      // Map angle into 8-direction octants for discrete tile stepping
      const rel = magnitudeFinal === 0 ? { dx: 0, dy: 0 } : octantToStep[Math.floor((angleDeg360 + 22.5) / 45) % 8];

      vectorMap[y][x] = {
        x,
        y,
        vector: { dx: vx, dy: vy },
        magnitude: magnitudeFinal,
        endPoint: {
          // endpoint: the tile containing the weighted center (where weights sum to)
          //x: Math.max(0, Math.min(width - 1, Math.round(centerX))),
          //y: Math.max(0, Math.min(height - 1, Math.round(centerY))),
          relative_x: rel.dx,
          relative_y: rel.dy,
        },
        angleDeg360,
      };
    }
  }

  return vectorMap;
}
