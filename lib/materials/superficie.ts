/** Superficie de una pieza de madera en cm² (ancho × largo, ambos en cm). */
export function superficieCm2FromDimensions(
  anchoCm: number,
  largoCm: number,
): number {
  return anchoCm * largoCm;
}

export function formatSuperficieCm2(value: number): string {
  return `${value.toLocaleString("es-AR")} cm²`;
}

export function formatSuperficieCm2Value(value: number): string {
  return value.toLocaleString("es-AR");
}

export function formatSuperficieCm2Preview(
  anchoCm: string,
  largoCm: string,
): string {
  const ancho = Number(anchoCm);
  const largo = Number(largoCm);
  if (
    !Number.isFinite(ancho) ||
    !Number.isFinite(largo) ||
    ancho <= 0 ||
    largo <= 0
  ) {
    return "";
  }
  return formatSuperficieCm2(superficieCm2FromDimensions(ancho, largo));
}
