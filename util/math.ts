export function clampNum(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}