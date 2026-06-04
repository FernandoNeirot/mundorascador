import type { EnsambleCotizacionPrefs } from "./types";

export const DEFAULT_ENSAMBLE_COTIZACION_PREFS: EnsambleCotizacionPrefs = {
  maderaProductKey: "",
  telaProductKey: "",
  aplicarTelaEnMaderas: true,
  aplicarExtrasColumnas: true,
  columnaTelaProductKey: "",
  columnaHiloProductKey: "",
  columnaTornillosProductKey: "",
  hiloMetrosPorColumna: "1.5",
  tornillosPorColumna: "4",
};

export function normalizeEnsambleCotizacionPrefs(
  value: unknown,
): EnsambleCotizacionPrefs {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_ENSAMBLE_COTIZACION_PREFS };
  }
  const p = value as Record<string, unknown>;
  return {
    maderaProductKey:
      typeof p.maderaProductKey === "string" ? p.maderaProductKey : "",
    telaProductKey:
      typeof p.telaProductKey === "string" ? p.telaProductKey : "",
    aplicarTelaEnMaderas:
      typeof p.aplicarTelaEnMaderas === "boolean"
        ? p.aplicarTelaEnMaderas
        : DEFAULT_ENSAMBLE_COTIZACION_PREFS.aplicarTelaEnMaderas,
    aplicarExtrasColumnas:
      typeof p.aplicarExtrasColumnas === "boolean"
        ? p.aplicarExtrasColumnas
        : DEFAULT_ENSAMBLE_COTIZACION_PREFS.aplicarExtrasColumnas,
    columnaTelaProductKey:
      typeof p.columnaTelaProductKey === "string"
        ? p.columnaTelaProductKey
        : "",
    columnaHiloProductKey:
      typeof p.columnaHiloProductKey === "string"
        ? p.columnaHiloProductKey
        : "",
    columnaTornillosProductKey:
      typeof p.columnaTornillosProductKey === "string"
        ? p.columnaTornillosProductKey
        : "",
    hiloMetrosPorColumna:
      typeof p.hiloMetrosPorColumna === "string" &&
      p.hiloMetrosPorColumna.trim()
        ? p.hiloMetrosPorColumna
        : DEFAULT_ENSAMBLE_COTIZACION_PREFS.hiloMetrosPorColumna,
    tornillosPorColumna:
      typeof p.tornillosPorColumna === "string" &&
      p.tornillosPorColumna.trim()
        ? p.tornillosPorColumna
        : DEFAULT_ENSAMBLE_COTIZACION_PREFS.tornillosPorColumna,
  };
}
