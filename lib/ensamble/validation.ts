import {
  EMPTY_RASCADOR_CONFIG,
  normalizeConfigPisosOrder,
} from "./cat-scratcher";
import type {
  ColumnaPosicionConfig,
  PisoNivelConfig,
  PisoPosicionConfig,
  RascadorEnsambleConfig,
  SoporteTramoConfig,
} from "./cat-scratcher";
import type {
  CreateEnsambleInput,
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
    parsePositiveNumber(s.columnaAltoCm) === null ||
    parsePositiveNumber(s.columnaAnchoCm) === null ||
    parsePositiveNumber(s.columnaProfundoCm) === null
  ) {
    return false;
  }
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

  if (record.config === undefined) {
    return { ok: true, data: { tipo, config: EMPTY_RASCADOR_CONFIG } };
  }

  if (!isValidRascadorConfig(record.config)) {
    return { ok: false, error: "Configuración del rascador inválida." };
  }

  return {
    ok: true,
    data: {
      tipo,
      config: normalizeConfigPisosOrder(record.config),
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
  if (!isValidRascadorConfig(record.config)) {
    return { ok: false, error: "Configuración del rascador inválida." };
  }

  return {
    ok: true,
    data: { config: normalizeConfigPisosOrder(record.config) },
  };
}
