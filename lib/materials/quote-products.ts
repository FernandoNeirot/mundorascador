import { MATERIAL_CONFIG, isMeterBasedType } from "./constants";
import { formatEntryDetails, getUnitPrice } from "./format";
import type { StockEntry } from "./types";

export type QuoteProductOption = {
  key: string;
  descripcion: string;
  label: string;
  unitPrice: number;
  quantityUnit: "metros" | "unidades";
};

function getEntryDescripcion(entry: StockEntry): string {
  switch (entry.type) {
    case "telas":
    case "guata":
    case "hilo":
    case "herramientas":
      return entry.descripcion;
    default:
      return formatEntryDetails(entry);
  }
}

/** Agrupa por producto sin distinguir quién compró (para cotización). */
function getQuoteGroupKey(entry: StockEntry): string {
  switch (entry.type) {
    case "telas":
    case "guata":
      return `${entry.type}|${entry.descripcion.toLowerCase()}|${entry.color.toLowerCase()}|${entry.anchoCm}|${entry.largoCm}`;
    case "hilo":
      return `${entry.type}|${entry.descripcion.toLowerCase()}|${entry.largoCm}`;
    case "maderas":
      return `${entry.type}|${entry.tipoMadera}|${entry.anchoCm}|${entry.largoCm}`;
    case "cano_pvc":
      return `${entry.type}|${entry.anchoMm}|${entry.largoCm}`;
    case "herramientas":
      return `${entry.type}|${entry.descripcion.toLowerCase()}`;
  }
}

function weightedUnitPrice(entries: StockEntry[]): number {
  const totalQuantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  if (totalQuantity <= 0) return getUnitPrice(entries[0]);

  const totalCost = entries.reduce(
    (sum, entry) => sum + entry.quantity * getUnitPrice(entry),
    0,
  );
  return totalCost / totalQuantity;
}

export function buildQuoteProductOptions(
  entries: StockEntry[],
): QuoteProductOption[] {
  const groups = new Map<string, StockEntry[]>();

  for (const entry of entries) {
    const key = getQuoteGroupKey(entry);
    const current = groups.get(key) ?? [];
    current.push(entry);
    groups.set(key, current);
  }

  return Array.from(groups.entries())
    .map(([key, groupEntries]) => {
      const sample = groupEntries[0];
      const descripcion = getEntryDescripcion(sample);
      const details = formatEntryDetails(sample);

      const quantityUnit: QuoteProductOption["quantityUnit"] = isMeterBasedType(
        sample.type,
      )
        ? "metros"
        : "unidades";

      return {
        key,
        descripcion,
        label: `${MATERIAL_CONFIG[sample.type].label} · ${details}`,
        unitPrice: weightedUnitPrice(groupEntries),
        quantityUnit,
      };
    })
    .sort((a, b) =>
      a.descripcion.localeCompare(b.descripcion, "es") ||
      a.label.localeCompare(b.label, "es"),
    );
}
