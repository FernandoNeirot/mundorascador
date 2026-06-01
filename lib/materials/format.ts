import { isMeterBasedType, WOOD_TYPE_CONFIG } from "./constants";
import {
  getRemainingCm2,
  getStockCm2,
  getUsedCm2,
  isStockEntryWithCortes,
} from "./cortes";
import { formatSuperficieCm2, superficieCm2FromDimensions } from "./superficie";
import type { MaterialType, MaderaStockEntry, StockEntry } from "./types";

export function getMaderaSuperficieCm2(entry: MaderaStockEntry): number {
  return (
    entry.superficieCm2 ??
    superficieCm2FromDimensions(entry.anchoCm, entry.largoCm)
  );
}

const AR_TIMEZONE = "America/Argentina/Buenos_Aires";

/** Formato estable entre servidor y cliente (evita hydration mismatch de Intl). */
export const formatPrice = (price: number): string => {
  const [integer, decimal = "00"] = price.toFixed(2).split(".");
  const withSeparators = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$ ${withSeparators},${decimal}`;
};

/** Formato estable entre servidor y cliente (evita hydration mismatch de Intl). */
export const formatDate = (iso: string): string => {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: AR_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`;
};

/** Precio por unidad de medida del material (por metro, por pieza, etc.). */
export const getUnitPrice = (entry: StockEntry): number => entry.price;

/** Inversión total de un registro: cantidad × precio unitario. */
export const calculateTotalPrice = (entry: StockEntry): number =>
  entry.quantity * entry.price;

export const getCantidadUsada = (entry: StockEntry): number =>
  entry.cantidadUsada ?? 0;

export const getRemainingQuantity = (entry: StockEntry): number =>
  entry.quantity - getCantidadUsada(entry);

/** Stock total en la unidad mostrada en tabla (cm² para maderas y telas). */
export const getDisplayStockQuantity = (entry: StockEntry): number => {
  if (isStockEntryWithCortes(entry)) {
    return getStockCm2(entry);
  }
  return entry.quantity;
};

/** Cantidad usada en la unidad mostrada en tabla (cm² para maderas y telas). */
export const getDisplayCantidadUsada = (entry: StockEntry): number => {
  if (isStockEntryWithCortes(entry)) {
    return getUsedCm2(entry);
  }
  return getCantidadUsada(entry);
};

/** Stock restante en la unidad mostrada en tabla (cm² para maderas y telas). */
export const getDisplayRemainingQuantity = (entry: StockEntry): number => {
  if (isStockEntryWithCortes(entry)) {
    return getRemainingCm2(entry);
  }
  return getRemainingQuantity(entry);
};

export const getQuantityUnitShort = (
  type: MaterialType,
): "m" | "u" | "cm²" => {
  if (type === "maderas" || type === "telas") return "cm²";
  return isMeterBasedType(type) ? "m" : "u";
};

export const formatEntryDetails = (entry: StockEntry): string => {
  switch (entry.type) {
    case "telas": {
      const superficie =
        entry.superficieCm2 ??
        superficieCm2FromDimensions(entry.anchoCm, entry.largoCm);
      return `${entry.descripcion} · ${entry.anchoCm} × ${entry.largoCm} cm · ${entry.color} · ${formatSuperficieCm2(superficie)}`;
    }
    case "guata":
      return `${entry.descripcion} · ${entry.anchoCm} × ${entry.largoCm} cm · ${entry.color}`;
    case "hilo":
      return `${entry.descripcion} · ${entry.largoCm} cm`;
    case "maderas":
      return `${WOOD_TYPE_CONFIG[entry.tipoMadera].label} · ${entry.anchoCm} × ${entry.largoCm} cm · ${formatSuperficieCm2(entry.superficieCm2)}`;
    case "cano_pvc":
      return `Ø ${entry.anchoMm} mm × ${entry.largoCm} cm`;
    case "herramientas":
      return entry.descripcion;
  }
};
