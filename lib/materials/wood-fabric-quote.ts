import { superficieCm2FromDimensions } from "./superficie";
import type { TelaStockEntry } from "./types";

/**
 * Sobresaliente por lado: 2 cm de espesor de madera + 3 cm de agarre arriba.
 * Un solo corte de tela cubre los dos lados de la pieza.
 */
export const FABRIC_LATERAL_OVERHANG_CM = 5;

export type WoodFabricCutSuggestion = {
  anchoCm: number;
  largoCm: number;
  superficieCm2: number;
};

/** Medida de corte de tela para tapizar ambos lados de una pieza de madera. */
export function suggestedFabricCutForWood(
  woodAnchoCm: number,
  woodLargoCm: number,
): WoodFabricCutSuggestion {
  const anchoCm = woodAnchoCm + FABRIC_LATERAL_OVERHANG_CM * 2;
  const largoCm = woodLargoCm * 2 + FABRIC_LATERAL_OVERHANG_CM * 2;
  return {
    anchoCm,
    largoCm,
    superficieCm2: superficieCm2FromDimensions(anchoCm, largoCm),
  };
}

/** Precio por cm² a partir del precio por metro del rollo de tela. */
export function getTelaPricePerCm2(entry: TelaStockEntry): number {
  if (entry.anchoCm <= 0 || entry.quantity <= 0) return 0;
  const rollAreaCm2 = entry.anchoCm * (entry.quantity * 100);
  if (rollAreaCm2 <= 0) return 0;
  const rollCost = entry.price * entry.quantity;
  return rollCost / rollAreaCm2;
}

export function calculateFabricCostFromCm2(
  superficieCm2: number,
  pricePerCm2: number,
): number {
  if (superficieCm2 <= 0 || pricePerCm2 <= 0) return 0;
  return superficieCm2 * pricePerCm2;
}
