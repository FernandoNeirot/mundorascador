import { superficieCm2FromDimensions } from "./superficie";
import type {
  MaterialType,
  StockCorte,
  StockEntry,
  StockEntryWithCortes,
} from "./types";

/** Pérdida por lado al cortar (ancho de hoja de la máquina). */
export const KERF_CM_PER_SIDE = 0.5;

export const supportsCortesTracking = (
  type: MaterialType,
): type is "maderas" | "telas" => type === "maderas" || type === "telas";

export function isStockEntryWithCortes(
  entry: StockEntry,
): entry is StockEntryWithCortes {
  return supportsCortesTracking(entry.type);
}

/** Superficie descontada de stock por un corte (medidas + kerf en cada lado). */
export function superficieCorteUsadaCm2(
  anchoCm: number,
  largoCm: number,
): number {
  return superficieCm2FromDimensions(
    anchoCm + KERF_CM_PER_SIDE * 2,
    largoCm + KERF_CM_PER_SIDE * 2,
  );
}

export function totalSuperficieCortesUsadaCm2(cortes: StockCorte[]): number {
  return cortes.reduce(
    (sum, corte) =>
      sum + superficieCorteUsadaCm2(corte.anchoCm, corte.largoCm),
    0,
  );
}

type AreaStockLike = {
  quantity: number;
  superficieCm2?: number;
  anchoCm: number;
  largoCm: number;
};

function resolveSuperficieCm2(entry: AreaStockLike): number {
  return (
    entry.superficieCm2 ??
    superficieCm2FromDimensions(entry.anchoCm, entry.largoCm)
  );
}

export function getMaderaStockCm2(entry: AreaStockLike): number {
  return entry.quantity * resolveSuperficieCm2(entry);
}

export function getTelaStockCm2(entry: AreaStockLike): number {
  return resolveSuperficieCm2(entry);
}

export function getStockCm2(entry: StockEntryWithCortes): number {
  if (entry.type === "maderas") {
    return getMaderaStockCm2(entry);
  }
  return getTelaStockCm2(entry);
}

export function getUsedCm2(entry: StockEntryWithCortes): number {
  return totalSuperficieCortesUsadaCm2(entry.cortes ?? []);
}

export function getRemainingCm2(entry: StockEntryWithCortes): number {
  return Math.max(0, getStockCm2(entry) - getUsedCm2(entry));
}

export function buildCortesUpdatePayload(
  entry: StockEntryWithCortes,
  cortes: StockCorte[],
): Record<string, unknown> {
  const base = {
    quantity: entry.quantity,
    price: entry.price,
    compradoPor: entry.compradoPor,
    cortes,
  };

  if (entry.type === "maderas") {
    return {
      ...base,
      type: "maderas",
      anchoCm: entry.anchoCm,
      largoCm: entry.largoCm,
      tipoMadera: entry.tipoMadera,
    };
  }

  return {
    ...base,
    type: "telas",
    descripcion: entry.descripcion,
    anchoCm: entry.anchoCm,
    largoCm: entry.largoCm,
    color: entry.color,
  };
}

/** @deprecated Usar buildCortesUpdatePayload */
export const buildMaderaUpdatePayload = buildCortesUpdatePayload;
