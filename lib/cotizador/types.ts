import type { CommittedQuoteLine } from "@/lib/materials/quote-line";

/** Material cotizado dentro de una cotización. */
export type CotizacionMaterial = CommittedQuoteLine;

export type CotizacionPricing = {
  precioMinimo: number;
  precioVenta: number;
  reinversionPct: number;
  gananciaPct: number;
  gananciaFernandoPct: number;
  gananciaChinoPct: number;
  gananciaFlavioPct: number;
};

/** Snapshot del resumen al momento de guardar (recuperable desde Firebase). */
export type CotizacionPricingResumen = {
  precioCosto: number;
  precioMinimo: number;
  precioVenta: number;
  reinversionMonto: number;
  gananciaMonto: number;
  gananciaFernando: number;
  gananciaChino: number;
  gananciaFlavio: number;
};

export type Cotizacion = {
  id: string;
  nombre: string;
  descripcion: string;
  materiales: CotizacionMaterial[];
  pricing: CotizacionPricing;
  pricingResumen: CotizacionPricingResumen;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type CreateCotizacionInput = {
  nombre: string;
  descripcion: string;
  materiales?: CotizacionMaterial[];
  pricing?: CotizacionPricing;
  pricingResumen?: CotizacionPricingResumen;
};

export type UpdateCotizacionInput = {
  nombre?: string;
  descripcion?: string;
  materiales?: CotizacionMaterial[];
  pricing?: CotizacionPricing;
  pricingResumen?: CotizacionPricingResumen;
};
