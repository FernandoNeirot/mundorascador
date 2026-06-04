import { MATERIAL_CONFIG, isMeterBasedType } from "./constants";
import { getStockCm2, isStockEntryWithCortes } from "./cortes";
import { calculateTotalPrice, formatEntryDetails, getUnitPrice } from "./format";
import type { MaterialType, StockEntry } from "./types";

export function isUsableInProducts(entry: StockEntry): boolean {
  return entry.usarEnProductos;
}

export type QuoteQuantityUnit = "metros" | "unidades" | "cm²" | "cm";

export type QuoteProductOption = {
  key: string;
  materialType: MaterialType;
  descripcion: string;
  materialLabel: string;
  details: string;
  label: string;
  unitPrice: number;
  quantityUnit: QuoteQuantityUnit;
};

function getEntryDescripcion(entry: StockEntry): string {
  switch (entry.type) {
    case "telas":
    case "guata":
    case "hilo":
    case "herramientas":
    case "cano":
    case "maderas":
      return entry.descripcion;
    default:
      return formatEntryDetails(entry);
  }
}

function normalizeDescripcion(value: string): string {
  return value.trim().toLowerCase();
}

/** Agrupa por tipo + descripción (sin comprador ni medidas). */
function getQuoteGroupKey(entry: StockEntry): string {
  return `${entry.type}|${normalizeDescripcion(getEntryDescripcion(entry))}`;
}

/** Precio unitario de cotización para un registro de stock. */
export function getQuoteUnitPriceForEntry(entry: StockEntry): number {
  if (isStockEntryWithCortes(entry)) {
    const cm2 = getStockCm2(entry);
    if (cm2 <= 0) return 0;
    return calculateTotalPrice(entry) / cm2;
  }

  return getUnitPrice(entry);
}

function pickHighestPricedEntry(entries: StockEntry[]): StockEntry {
  return entries.reduce((best, entry) =>
    getQuoteUnitPriceForEntry(entry) > getQuoteUnitPriceForEntry(best)
      ? entry
      : best,
  );
}

function resolveQuotePricing(
  sample: StockEntry,
  groupEntries: StockEntry[],
): Pick<QuoteProductOption, "unitPrice" | "quantityUnit"> {
  const unitPrice = Math.max(
    ...groupEntries.map((entry) => getQuoteUnitPriceForEntry(entry)),
    0,
  );

  if (sample.type === "telas" || sample.type === "maderas") {
    return { unitPrice, quantityUnit: "cm²" };
  }

  if (sample.type === "cano") {
    return { unitPrice, quantityUnit: "cm" };
  }

  if (isMeterBasedType(sample.type)) {
    return { unitPrice, quantityUnit: "metros" };
  }

  return { unitPrice, quantityUnit: "unidades" };
}

export function buildQuoteProductOptions(
  entries: StockEntry[],
): QuoteProductOption[] {
  const groups = new Map<string, StockEntry[]>();

  for (const entry of entries) {
    if (!isUsableInProducts(entry)) continue;

    const key = getQuoteGroupKey(entry);
    const current = groups.get(key) ?? [];
    current.push(entry);
    groups.set(key, current);
  }

  return Array.from(groups.entries())
    .map(([key, groupEntries]) => {
      const sample = pickHighestPricedEntry(groupEntries);
      const descripcion = getEntryDescripcion(sample).trim();
      const details = formatEntryDetails(sample);

      const pricing = resolveQuotePricing(sample, groupEntries);

      return {
        key,
        materialType: sample.type,
        descripcion,
        materialLabel: MATERIAL_CONFIG[sample.type].label,
        details,
        label: descripcion,
        ...pricing,
      };
    })
    .sort((a, b) =>
      a.descripcion.localeCompare(b.descripcion, "es") ||
      a.label.localeCompare(b.label, "es"),
    );
}
