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

export type Cotizacion = {
  id: string;
  nombre: string;
  descripcion: string;
  materiales: CotizacionMaterial[];
  pricing: CotizacionPricing;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type CreateCotizacionInput = {
  nombre: string;
  descripcion: string;
  materiales?: CotizacionMaterial[];
  pricing?: CotizacionPricing;
};

export type UpdateCotizacionInput = {
  nombre?: string;
  descripcion?: string;
  materiales?: CotizacionMaterial[];
  pricing?: CotizacionPricing;
};
