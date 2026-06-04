import type { CotizacionMaterial } from "@/lib/cotizador/types";
import type { RascadorEnsambleConfig } from "./cat-scratcher";

export type EnsambleTipo = "rascador-gatos";

/** Preferencias para importar piezas → materiales cotizados. */
export type EnsambleCotizacionPrefs = {
  maderaProductKey: string;
  telaProductKey: string;
  aplicarTelaEnMaderas: boolean;
  aplicarExtrasColumnas: boolean;
  columnaTelaProductKey: string;
  columnaHiloProductKey: string;
  columnaTornillosProductKey: string;
  hiloMetrosPorColumna: string;
  tornillosPorColumna: string;
};

/**
 * Producto unificado: diseño (ensamble) + cotización en `taller-ensambles`.
 * Pensado para un futuro MVP de publicación con imagen.
 */
export type Ensamble = {
  id: string;
  tipo: EnsambleTipo;
  config: RascadorEnsambleConfig;
  descripcion: string;
  materiales: CotizacionMaterial[];
  cotizacionPrefs: EnsambleCotizacionPrefs;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type CreateEnsambleInput = {
  tipo?: EnsambleTipo;
  config?: RascadorEnsambleConfig;
  descripcion?: string;
  materiales?: CotizacionMaterial[];
  cotizacionPrefs?: EnsambleCotizacionPrefs;
};

export type UpdateEnsambleInput = {
  config?: RascadorEnsambleConfig;
  descripcion?: string;
  materiales?: CotizacionMaterial[];
  cotizacionPrefs?: EnsambleCotizacionPrefs;
};
