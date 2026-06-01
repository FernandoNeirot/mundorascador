import type { CommittedQuoteLine } from "@/lib/materials/quote-line";

/** Material cotizado dentro de una cotización. */
export type CotizacionMaterial = CommittedQuoteLine;

export type Cotizacion = {
  id: string;
  nombre: string;
  descripcion: string;
  materiales: CotizacionMaterial[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type CreateCotizacionInput = {
  nombre: string;
  descripcion: string;
  materiales?: CotizacionMaterial[];
};

export type UpdateCotizacionInput = {
  nombre?: string;
  descripcion?: string;
  materiales?: CotizacionMaterial[];
};
