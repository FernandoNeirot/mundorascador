import { isMeterBasedType, WOOD_TYPE_CONFIG } from "./constants";
import type { MaterialType, StockEntry } from "./types";

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

export const getQuantityUnitShort = (type: MaterialType): "m" | "u" =>
  isMeterBasedType(type) ? "m" : "u";

export const formatEntryDetails = (entry: StockEntry): string => {
  switch (entry.type) {
    case "telas":
    case "guata":
      return `${entry.descripcion} · ${entry.anchoCm} × ${entry.largoCm} cm · ${entry.color}`;
    case "hilo":
      return `${entry.descripcion} · ${entry.largoCm} cm`;
    case "maderas":
      return `${WOOD_TYPE_CONFIG[entry.tipoMadera].label} · ${entry.anchoCm} × ${entry.largoCm} cm`;
    case "cano_pvc":
      return `Ø ${entry.anchoMm} mm × ${entry.largoCm} cm`;
    case "herramientas":
      return entry.descripcion;
  }
};
