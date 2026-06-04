import type {
  CotizacionMaterial,
  CreateCotizacionInput,
  UpdateCotizacionInput,
} from "./types";

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function parseString(value: unknown, label: string): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed;
}

function parseOptionalString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isValidMaterial(value: unknown): value is CotizacionMaterial {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;

  if (typeof line.id !== "string" || !line.id.trim()) return false;
  if (typeof line.productKey !== "string" || !line.productKey.trim()) {
    return false;
  }
  if (typeof line.cutAnchoCm !== "string") return false;
  if (typeof line.cutLargoCm !== "string") return false;
  if (typeof line.pieceCount !== "string") return false;
  if (typeof line.quantityUsed !== "string") return false;

  if (line.pairId !== undefined && typeof line.pairId !== "string") {
    return false;
  }
  if (
    line.pairRole !== undefined &&
    line.pairRole !== "madera" &&
    line.pairRole !== "tela"
  ) {
    return false;
  }

  return true;
}

export function parseMateriales(value: unknown): CotizacionMaterial[] | string {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return "materiales debe ser un array.";

  const materiales: CotizacionMaterial[] = [];
  for (const item of value) {
    if (!isValidMaterial(item)) {
      return "Cada material debe tener id, productKey y cantidades válidas.";
    }
    materiales.push(item);
  }

  return materiales;
}

export function validateCreateCotizacion(
  body: unknown,
): ValidationResult<CreateCotizacionInput> {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Datos inválidos." };
  }

  const input = body as Record<string, unknown>;
  const nombre = parseString(input.nombre, "nombre");
  if (!nombre) {
    return { ok: false, error: "El nombre es obligatorio." };
  }

  const materiales = parseMateriales(input.materiales);
  if (typeof materiales === "string") {
    return { ok: false, error: materiales };
  }

  return {
    ok: true,
    data: {
      nombre,
      descripcion: parseOptionalString(input.descripcion),
      materiales,
    },
  };
}

export function validateUpdateCotizacion(
  body: unknown,
): ValidationResult<UpdateCotizacionInput> {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Datos inválidos." };
  }

  const input = body as Record<string, unknown>;
  const data: UpdateCotizacionInput = {};

  if (input.nombre !== undefined) {
    const nombre = parseString(input.nombre, "nombre");
    if (!nombre) {
      return { ok: false, error: "El nombre no puede estar vacío." };
    }
    data.nombre = nombre;
  }

  if (input.descripcion !== undefined) {
    data.descripcion = parseOptionalString(input.descripcion);
  }

  if (input.materiales !== undefined) {
    const materiales = parseMateriales(input.materiales);
    if (typeof materiales === "string") {
      return { ok: false, error: materiales };
    }
    data.materiales = materiales;
  }

  if (
    data.nombre === undefined &&
    data.descripcion === undefined &&
    data.materiales === undefined
  ) {
    return { ok: false, error: "No hay cambios para guardar." };
  }

  return { ok: true, data };
}
