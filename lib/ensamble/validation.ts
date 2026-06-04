import { parseMateriales } from "@/lib/cotizador/validation";
import {
  EMPTY_RASCADOR_CONFIG,
  normalizeConfigPisosOrder,
} from "./cat-scratcher";
import { normalizeEnsambleCotizacionPrefs } from "./cotizacion-prefs";
import type {
  CasitaEnPisoConfig,
  ColumnaPosicionConfig,
  PisoNivelConfig,
  PisoPosicionConfig,
  RascadorEnsambleConfig,
  SoporteTramoConfig,
} from "./cat-scratcher";
import type {
  CreateEnsambleInput,
  EnsambleCotizacionPrefs,
  EnsambleTipo,
  UpdateEnsambleInput,
} from "./types";

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function parsePositiveNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function parseNonNegativeNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function isValidColumnaPosicion(value: unknown): value is ColumnaPosicionConfig {
  if (!value || typeof value !== "object") return false;
  const pos = value as Record<string, unknown>;
  return (
    parseNonNegativeNumber(pos.xCm) !== null &&
    parseNonNegativeNumber(pos.yCm) !== null
  );
}

function isValidSoporteTramo(value: unknown): value is SoporteTramoConfig {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  if (
    parsePositiveNumber(s.columnaCantidad) === null ||
    parsePositiveNumber(s.columnaAltoCm) === null
  ) {
    return false;
  }
  const diametro =
    parsePositiveNumber(s.columnaDiametroCm) ??
    parsePositiveNumber(s.columnaAnchoCm);
  if (diametro === null) return false;
  if (typeof s.casitaActiva !== "boolean") return false;
  if (parsePositiveNumber(s.casitaColumnaIndice) === null) return false;
  if (
    parsePositiveNumber(s.casitaAnchoCm) === null ||
    parsePositiveNumber(s.casitaProfundoCm) === null
  ) {
    return false;
  }
  if (!Array.isArray(s.columnaPosiciones)) return false;
  return s.columnaPosiciones.every(isValidColumnaPosicion);
}

function isValidCasitaEnPiso(value: unknown): value is CasitaEnPisoConfig {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  if (
    parsePositiveNumber(c.anchoCm) === null ||
    parsePositiveNumber(c.largoCm) === null ||
    parsePositiveNumber(c.altoCm) === null
  ) {
    return false;
  }
  if (typeof c.columnaEnTecho !== "boolean") return false;
  if (parsePositiveNumber(c.columnaAltoCm) === null) return false;
  const columnaDiametro =
    parsePositiveNumber(c.columnaDiametroCm) ??
    parsePositiveNumber(c.columnaAnchoCm);
  if (columnaDiametro === null) return false;
  return isValidColumnaPosicion(c.posicionCm);
}

function isValidPisoNivel(value: unknown): value is PisoNivelConfig {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  if (typeof p.id !== "string" || !p.id.trim()) return false;
  if (typeof p.etiqueta !== "string" || !p.etiqueta.trim()) return false;
  if (
    parsePositiveNumber(p.anchoCm) === null ||
    parsePositiveNumber(p.largoCm) === null
  ) {
    return false;
  }
  if (p.posicionCm !== undefined && !isValidPisoPosicion(p.posicionCm)) {
    return false;
  }
  if (p.soporte !== undefined && !isValidSoporteTramo(p.soporte)) {
    return false;
  }
  if (p.casita !== undefined && !isValidCasitaEnPiso(p.casita)) {
    return false;
  }
  return true;
}

function isValidPisoPosicion(value: unknown): value is PisoPosicionConfig {
  if (!value || typeof value !== "object") return false;
  const pos = value as Record<string, unknown>;
  return (
    parseNonNegativeNumber(pos.xCm) !== null &&
    parseNonNegativeNumber(pos.yCm) !== null
  );
}

export function isValidRascadorConfig(
  value: unknown,
): value is RascadorEnsambleConfig {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  if (typeof c.nombre !== "string") return false;
  if (!Array.isArray(c.pisos)) return false;
  return c.pisos.every(isValidPisoNivel);
}

function parseTipo(value: unknown): EnsambleTipo | null {
  if (value === undefined || value === null) return "rascador-gatos";
  if (value === "rascador-gatos") return value;
  return null;
}

function parseDescripcion(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function parseCotizacionPrefs(
  value: unknown,
): EnsambleCotizacionPrefs | string {
  if (value === undefined) {
    return normalizeEnsambleCotizacionPrefs(undefined);
  }
  if (!value || typeof value !== "object") {
    return "Preferencias de cotización inválidas.";
  }
  return normalizeEnsambleCotizacionPrefs(value);
}

export function validateCreateEnsamble(
  body: unknown,
): ValidationResult<CreateEnsambleInput> {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Cuerpo de solicitud inválido." };
  }

  const record = body as Record<string, unknown>;
  const tipo = parseTipo(record.tipo);
  if (!tipo) {
    return { ok: false, error: "Tipo de ensamble no válido." };
  }

  const config =
    record.config === undefined
      ? EMPTY_RASCADOR_CONFIG
      : isValidRascadorConfig(record.config)
        ? normalizeConfigPisosOrder(record.config)
        : null;

  if (!config) {
    return { ok: false, error: "Configuración del rascador inválida." };
  }

  if (record.materiales !== undefined) {
    const materiales = parseMateriales(record.materiales);
    if (typeof materiales === "string") {
      return { ok: false, error: materiales };
    }
  }

  const prefs = parseCotizacionPrefs(record.cotizacionPrefs);
  if (typeof prefs === "string") {
    return { ok: false, error: prefs };
  }

  const materialesParsed = parseMateriales(record.materiales ?? []);

  return {
    ok: true,
    data: {
      tipo,
      config,
      descripcion: parseDescripcion(record.descripcion),
      materiales:
        typeof materialesParsed === "string" ? [] : materialesParsed,
      cotizacionPrefs: prefs,
    },
  };
}

export function validateUpdateEnsamble(
  body: unknown,
): ValidationResult<UpdateEnsambleInput> {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Cuerpo de solicitud inválido." };
  }

  const record = body as Record<string, unknown>;
  const data: UpdateEnsambleInput = {};

  if (record.config !== undefined) {
    if (!isValidRascadorConfig(record.config)) {
      return { ok: false, error: "Configuración del rascador inválida." };
    }
    data.config = normalizeConfigPisosOrder(record.config);
  }

  if (record.descripcion !== undefined) {
    data.descripcion = parseDescripcion(record.descripcion);
  }

  if (record.materiales !== undefined) {
    const materiales = parseMateriales(record.materiales);
    if (typeof materiales === "string") {
      return { ok: false, error: materiales };
    }
    data.materiales = materiales;
  }

  if (record.cotizacionPrefs !== undefined) {
    const prefs = parseCotizacionPrefs(record.cotizacionPrefs);
    if (typeof prefs === "string") {
      return { ok: false, error: prefs };
    }
    data.cotizacionPrefs = prefs;
  }

  if (
    data.config === undefined &&
    data.descripcion === undefined &&
    data.materiales === undefined &&
    data.cotizacionPrefs === undefined
  ) {
    return { ok: false, error: "No hay cambios para guardar." };
  }

  return { ok: true, data };
}
