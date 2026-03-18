/**
 * @description Minimum és maximum érték közé szorít egy számot
 * @param {number} v a szám, amit szorítani szeretnénk
 * @param {number} min a minimum érték, amit a szám nem lehet kisebb
 * @param {number} max a maximum érték, amit a szám nem lehet nagyobb
 * @returns {number} a szorított szám, ami minimum és maximum között van
 */
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