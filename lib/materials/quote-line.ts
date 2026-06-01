import type { QuoteProductOption } from "./quote-products";
import { superficieCm2FromDimensions } from "./superficie";

export function usesCutBasedQuantity(
  product?: QuoteProductOption,
): boolean {
  return product?.materialType === "maderas" || product?.materialType === "telas";
}

export function parseCutCm2(anchoCm: string, largoCm: string): number | null {
  const ancho = Number(anchoCm);
  const largo = Number(largoCm);
  if (
    !Number.isFinite(ancho) ||
    ancho <= 0 ||
    !Number.isFinite(largo) ||
    largo <= 0
  ) {
    return null;
  }
  return superficieCm2FromDimensions(ancho, largo);
}

export type QuoteLineQuantities = {
  cutAnchoCm: string;
  cutLargoCm: string;
  pieceCount: string;
  quantityUsed: string;
};

export type CommittedQuoteLine = QuoteLineQuantities & {
  id: string;
  productKey: string;
  /** Vincula madera y tela agregadas juntas. */
  pairId?: string;
  pairRole?: "madera" | "tela";
};

export function findPairedLine(
  line: CommittedQuoteLine,
  lines: CommittedQuoteLine[],
): CommittedQuoteLine | undefined {
  if (!line.pairId) return undefined;
  return lines.find(
    (candidate) =>
      candidate.pairId === line.pairId && candidate.id !== line.id,
  );
}

export function getQuoteLineCost(
  line: QuoteLineQuantities,
  product?: QuoteProductOption,
): number {
  if (!product) return 0;

  if (usesCutBasedQuantity(product)) {
    const cm2 = parseCutCm2(line.cutAnchoCm, line.cutLargoCm);
    if (cm2 === null) return 0;
    const pieces = Math.max(1, Number(line.pieceCount) || 1);
    return cm2 * pieces * product.unitPrice;
  }

  const quantity = Number(line.quantityUsed);
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  return quantity * product.unitPrice;
}

export function formatQuoteLineQuantity(
  line: QuoteLineQuantities,
  product?: QuoteProductOption,
): string {
  if (!product) return "—";

  if (usesCutBasedQuantity(product)) {
    const ancho = line.cutAnchoCm.trim();
    const largo = line.cutLargoCm.trim();
    if (!ancho || !largo) return "Sin corte";

    const cut = `${ancho} × ${largo} cm`;
    const pieces = Math.max(1, Number(line.pieceCount) || 1);
    return pieces > 1 ? `${cut} · ${pieces} piezas` : cut;
  }

  const qty = line.quantityUsed.trim();
  if (!qty) return "Sin cantidad";
  return `${qty} ${product.quantityUnit}`;
}

export function isQuoteLineCommittable(
  line: QuoteLineQuantities,
  product?: QuoteProductOption,
): boolean {
  return getQuoteLineCost(line, product) > 0;
}
