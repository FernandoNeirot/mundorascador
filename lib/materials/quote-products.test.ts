import { describe, expect, it } from "vitest";
import {
  buildQuoteProductOptions,
  getQuoteUnitPriceForEntry,
} from "./quote-products";
import type { MaderaStockEntry, StockEntry } from "./types";

function madera(
  overrides: Partial<MaderaStockEntry> & Pick<MaderaStockEntry, "id" | "descripcion" | "price">,
): MaderaStockEntry {
  return {
    type: "maderas",
    updatedAt: "2026-01-01T00:00:00.000Z",
    quantity: 10,
    cantidadUsada: 0,
    compradoPor: "fernando",
    usarEnProductos: true,
    anchoCm: 40,
    largoCm: 50,
    superficieCm2: 2000,
    tipoMadera: "pino",
    cortes: [],
    ...overrides,
  };
}

describe("buildQuoteProductOptions", () => {
  it("agrupa por descripción y usa el precio unitario más alto", () => {
    const entries: StockEntry[] = [
      madera({
        id: "a",
        descripcion: "Tabla sillón",
        price: 100,
        compradoPor: "chino",
      }),
      madera({
        id: "b",
        descripcion: "Tabla sillón",
        price: 200,
        compradoPor: "flavio",
      }),
      madera({
        id: "c",
        descripcion: "Otra pieza",
        price: 500,
      }),
    ];

    const options = buildQuoteProductOptions(entries);

    expect(options).toHaveLength(2);

    const tabla = options.find((o) => o.descripcion === "Tabla sillón");
    expect(tabla?.label).toBe("Tabla sillón");
    expect(tabla?.unitPrice).toBe(getQuoteUnitPriceForEntry(entries[1]));
    expect(tabla?.unitPrice).toBeGreaterThan(
      getQuoteUnitPriceForEntry(entries[0]),
    );
  });
});
