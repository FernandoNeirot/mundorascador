import { calculateTotalPrice } from "./format";
import type { StockEntry } from "./types";

export type StockGroup = {
  key: string;
  entries: StockEntry[];
  totalQuantity: number;
  totalPrice: number;
};

export function getStockGroupKey(entry: StockEntry): string {
  const base = `${entry.type}|${entry.compradoPor}`;

  switch (entry.type) {
    case "telas":
    case "guata":
      return `${base}|${entry.descripcion.toLowerCase()}|${entry.color.toLowerCase()}|${entry.anchoCm}|${entry.largoCm}`;
    case "hilo":
      return `${base}|${entry.descripcion.toLowerCase()}|${entry.largoCm}`;
    case "maderas":
      return `${base}|${entry.tipoMadera}|${entry.anchoCm}|${entry.largoCm}`;
    case "cano_pvc":
      return `${base}|${entry.anchoMm}|${entry.largoCm}`;
    case "herramientas":
      return `${base}|${entry.descripcion.toLowerCase()}`;
  }
}

export function groupStockEntries(entries: StockEntry[]): StockGroup[] {
  const groups = new Map<string, StockEntry[]>();

  for (const entry of entries) {
    const key = getStockGroupKey(entry);
    const current = groups.get(key) ?? [];
    current.push(entry);
    groups.set(key, current);
  }

  return Array.from(groups.entries())
    .map(([key, groupEntries]) => {
      const sorted = [...groupEntries].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      return {
        key,
        entries: sorted,
        totalQuantity: sorted.reduce((sum, entry) => sum + entry.quantity, 0),
        totalPrice: sorted.reduce(
          (sum, entry) => sum + calculateTotalPrice(entry),
          0,
        ),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.entries[0].updatedAt).getTime() -
        new Date(a.entries[0].updatedAt).getTime(),
    );
}
