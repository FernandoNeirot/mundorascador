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

function roundPct(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Reinversión + ganancia siempre suman 100%. */
export function complementaryMarginPcts(
  changed: "reinversion" | "ganancia",
  value: number,
): Pick<CotizacionPricing, "reinversionPct" | "gananciaPct"> {
  const v = clampPct(value);
  const complement = roundPct(100 - v);
  if (changed === "reinversion") {
    return { reinversionPct: v, gananciaPct: complement };
  }
  return { gananciaPct: v, reinversionPct: complement };
}

/**
 * Fernando + Chino + Flavio siempre suman 100%.
 * Al cambiar uno se completa el "resto" (Flavio, o Chino si se edita Flavio).
 */
export function complementarySharePcts(
  changed: "fernando" | "chino" | "flavio",
  value: number,
  current: CotizacionPricing,
): Pick<
  CotizacionPricing,
  "gananciaFernandoPct" | "gananciaChinoPct" | "gananciaFlavioPct"
> {
  const v = clampPct(value);

  if (changed === "fernando") {
    const chino = Math.min(clampPct(current.gananciaChinoPct), roundPct(100 - v));
    return {
      gananciaFernandoPct: v,
      gananciaChinoPct: chino,
      gananciaFlavioPct: roundPct(100 - v - chino),
    };
  }

  if (changed === "chino") {
    const fernando = Math.min(
      clampPct(current.gananciaFernandoPct),
      roundPct(100 - v),
    );
    return {
      gananciaFernandoPct: fernando,
      gananciaChinoPct: v,
      gananciaFlavioPct: roundPct(100 - fernando - v),
    };
  }

  const fernando = Math.min(
    clampPct(current.gananciaFernandoPct),
    roundPct(100 - v),
  );
  return {
    gananciaFernandoPct: fernando,
    gananciaChinoPct: roundPct(100 - fernando - v),
    gananciaFlavioPct: v,
  };
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
