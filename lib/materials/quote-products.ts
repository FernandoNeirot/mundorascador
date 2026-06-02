import { MATERIAL_CONFIG, isMeterBasedType } from "./constants";
import { getStockCm2, isStockEntryWithCortes } from "./cortes";
import { calculateTotalPrice, formatEntryDetails, getUnitPrice } from "./format";
import type { MaterialType, StockEntry } from "./types";

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
    case "cano":
      return `${entry.type}|${entry.descripcion.toLowerCase()}|${entry.largoCm}`;
    case "herramientas":
      return `${entry.type}|${entry.descripcion.toLowerCase()}`;
  }
}

function weightedUnitPrice(entries: StockEntry[]): number {
  const totalQuantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  if (totalQuantity <= 0) return getUnitPrice(entries[0]);

  const totalCost = entries.reduce(
    (sum, entry) => sum + calculateTotalPrice(entry),
    0,
  );
  return totalCost / totalQuantity;
}

function weightedUnitPricePerCm2(entries: StockEntry[]): number {
  const areaEntries = entries.filter(isStockEntryWithCortes);
  const totalCm2 = areaEntries.reduce(
    (sum, entry) => sum + getStockCm2(entry),
    0,
  );
  if (totalCm2 <= 0) return 0;

  const totalCost = areaEntries.reduce(
    (sum, entry) => sum + calculateTotalPrice(entry),
    0,
  );
  return totalCost / totalCm2;
}

function weightedUnitPricePerCm(entries: StockEntry[]): number {
  const canoEntries = entries.filter((entry) => entry.type === "cano");
  const totalCm = canoEntries.reduce((sum, entry) => sum + entry.largoCm, 0);
  if (totalCm <= 0) return 0;

  const totalCost = canoEntries.reduce(
    (sum, entry) => sum + calculateTotalPrice(entry),
    0,
  );
  return totalCost / totalCm;
}

function resolveQuotePricing(
  sample: StockEntry,
  groupEntries: StockEntry[],
): Pick<QuoteProductOption, "unitPrice" | "quantityUnit"> {
  if (sample.type === "telas" || sample.type === "maderas") {
    return {
      unitPrice: weightedUnitPricePerCm2(groupEntries),
      quantityUnit: "cm²",
    };
  }

  if (sample.type === "cano") {
    return {
      unitPrice: weightedUnitPricePerCm(groupEntries),
      quantityUnit: "cm",
    };
  }

  if (isMeterBasedType(sample.type)) {
    return {
      unitPrice: weightedUnitPrice(groupEntries),
      quantityUnit: "metros",
    };
  }

  return {
    unitPrice: weightedUnitPrice(groupEntries),
    quantityUnit: "unidades",
  };
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

      const pricing = resolveQuotePricing(sample, groupEntries);

      return {
        key,
        materialType: sample.type,
        descripcion,
        materialLabel: MATERIAL_CONFIG[sample.type].label,
        details,
        label: `${MATERIAL_CONFIG[sample.type].label} · ${details}`,
        ...pricing,
      };
    })
    .sort((a, b) =>
      a.descripcion.localeCompare(b.descripcion, "es") ||
      a.label.localeCompare(b.label, "es"),
    );
}
