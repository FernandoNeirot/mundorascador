import type { CotizacionPricing } from "./types";

export const DEFAULT_COTIZACION_PRICING: CotizacionPricing = {
  precioMinimo: 0,
  precioVenta: 0,
  reinversionPct: 0,
  gananciaPct: 0,
  gananciaFernandoPct: 0,
  gananciaChinoPct: 0,
  gananciaFlavioPct: 0,
};

export type CotizacionPricingBreakdown = {
  precioCosto: number;
  precioMinimo: number;
  precioVenta: number;
  /** precioVenta - precioCosto (puede ser negativo). */
  margen: number;
  reinversionMonto: number;
  gananciaMonto: number;
  gananciaFernando: number;
  gananciaChino: number;
  gananciaFlavio: number;
};

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function nonNegativeMoney(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

export function normalizeCotizacionPricing(
  value: unknown,
): CotizacionPricing {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_COTIZACION_PRICING };
  }

  const raw = value as Record<string, unknown>;
  const num = (key: string): number => {
    const n = Number(raw[key]);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    precioMinimo: nonNegativeMoney(num("precioMinimo")),
    precioVenta: nonNegativeMoney(num("precioVenta")),
    reinversionPct: clampPct(num("reinversionPct")),
    gananciaPct: clampPct(num("gananciaPct")),
    gananciaFernandoPct: clampPct(num("gananciaFernandoPct")),
    gananciaChinoPct: clampPct(num("gananciaChinoPct")),
    gananciaFlavioPct: clampPct(num("gananciaFlavioPct")),
  };
}

/** margen = venta - costo; reinversión y ganancia sobre ese margen. */
export function computeCotizacionPricingBreakdown(
  precioCosto: number,
  pricing: CotizacionPricing,
): CotizacionPricingBreakdown {
  const costo = Number.isFinite(precioCosto) ? precioCosto : 0;
  const precioMinimo = nonNegativeMoney(pricing.precioMinimo);
  const precioVenta = nonNegativeMoney(pricing.precioVenta);
  const margen = precioVenta - costo;
  const reinversionMonto = margen * (clampPct(pricing.reinversionPct) / 100);
  const gananciaMonto = margen * (clampPct(pricing.gananciaPct) / 100);

  return {
    precioCosto: costo,
    precioMinimo,
    precioVenta,
    margen,
    reinversionMonto,
    gananciaMonto,
    gananciaFernando:
      gananciaMonto * (clampPct(pricing.gananciaFernandoPct) / 100),
    gananciaChino: gananciaMonto * (clampPct(pricing.gananciaChinoPct) / 100),
    gananciaFlavio: gananciaMonto * (clampPct(pricing.gananciaFlavioPct) / 100),
  };
}
