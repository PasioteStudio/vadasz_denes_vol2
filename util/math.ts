export function clampNum(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
/**
 * Visszaadja ugyanazt a struktúrát, de lemásolva
 * Így megakadályozza, hogy az eredeti változót felülírva
 * ezt is felülírják. (Allokál még egy memória helyet)
 * @param {T} array a változó, amit másolunk
 * 
 * @returns {T} egy másik változó, ugyanazzal az értékekkel, de másik memória helyen
 */
export function deepCopy<T>(array: T[]): T[] {
  return array.map(item =>
    typeof item === 'object' && item !== null && !Array.isArray(item)
      ? { ...item }
      : Array.isArray(item)
        ? deepCopy(item as unknown as T[])
        : item
  ) as T[];
}