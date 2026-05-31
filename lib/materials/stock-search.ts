import { BUYER_CONFIG, MATERIAL_CONFIG, WOOD_TYPE_CONFIG } from "./constants";
import {
  calculateTotalPrice,
  formatDate,
  formatEntryDetails,
  formatPrice,
  getCantidadUsada,
  getRemainingQuantity,
} from "./format";
import type { StockGroup } from "./grouping";
import type { StockEntry } from "./types";

function getEntrySearchParts(entry: StockEntry): string[] {
  const parts = [
    MATERIAL_CONFIG[entry.type].label,
    formatEntryDetails(entry),
    BUYER_CONFIG[entry.compradoPor].label,
    entry.compradoPor,
    String(entry.quantity),
    String(getCantidadUsada(entry)),
    String(getRemainingQuantity(entry)),
    String(entry.price),
    formatPrice(entry.price),
    formatPrice(calculateTotalPrice(entry)),
    formatDate(entry.updatedAt),
  ];

  switch (entry.type) {
    case "telas":
    case "guata":
      parts.push(entry.descripcion, entry.color, String(entry.anchoCm), String(entry.largoCm));
      break;
    case "hilo":
      parts.push(entry.descripcion, String(entry.largoCm));
      break;
    case "maderas":
      parts.push(
        entry.tipoMadera,
        WOOD_TYPE_CONFIG[entry.tipoMadera].label,
        String(entry.anchoCm),
        String(entry.largoCm),
      );
      break;
    case "cano_pvc":
      parts.push(String(entry.anchoMm), String(entry.largoCm));
      break;
    case "herramientas":
      parts.push(entry.descripcion);
      break;
  }

  return parts;
}

export function getGroupSearchText(group: StockGroup): string {
  const sample = group.entries[0];
  return [
    MATERIAL_CONFIG[sample.type].label,
    formatEntryDetails(sample),
    BUYER_CONFIG[sample.compradoPor].label,
    String(group.totalQuantity),
    formatPrice(group.totalPrice),
    ...group.entries.flatMap(getEntrySearchParts),
  ]
    .join(" ")
    .toLowerCase();
}

export function filterStockGroups(
  groups: StockGroup[],
  query: string,
): StockGroup[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return groups;
  return groups.filter((group) => getGroupSearchText(group).includes(trimmed));
}
