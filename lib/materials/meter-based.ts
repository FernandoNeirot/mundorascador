export const CM_PER_METER = 100;

/** El largo en cm debe ser estrictamente mayor a 100 (1 metro). */
export const MIN_LENGTH_CM_EXCLUSIVE = 100;

export function isValidLengthCm(largoCm: number): boolean {
  return Number.isFinite(largoCm) && largoCm > MIN_LENGTH_CM_EXCLUSIVE;
}

export function quantityFromLengthCm(largoCm: number): number {
  return largoCm / CM_PER_METER;
}

export function formatQuantityFromLength(largoCm: string): string {
  const parsed = Number(largoCm);
  if (!isValidLengthCm(parsed)) return "";
  const qty = quantityFromLengthCm(parsed);
  return Number.isInteger(qty) ? String(qty) : String(Number(qty.toFixed(4)));
}
