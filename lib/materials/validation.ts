import { ALL_STOCK_TYPES, BUYER_TYPES, WOOD_TYPES } from "./constants";
import type {
  BuyerType,
  CreateFabricLikeInput,
  CreateStockEntryInput,
  FabricLikeType,
  MaterialType,
  WoodType,
} from "./types";

type ValidationResult =
  | { ok: true; data: CreateStockEntryInput }
  | { ok: false; error: string };

const parsePositiveNumber = (
  value: unknown,
  field: string,
): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
};

const parseNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  return value.trim();
};

function parseCompradoPor(value: unknown): BuyerType | null {
  if (typeof value !== "string" || !BUYER_TYPES.includes(value as BuyerType)) {
    return null;
  }
  return value as BuyerType;
}

function parseFabricLikeInput(
  record: Record<string, unknown>,
  type: FabricLikeType,
  price: number,
  compradoPor: BuyerType,
): CreateFabricLikeInput | { error: string } {
  const marca = parseNonEmptyString(record.marca);
  const color = parseNonEmptyString(record.color);
  const anchoCm = parsePositiveNumber(record.anchoCm, "ancho");
  const largoCm = parsePositiveNumber(record.largoCm, "largo");
  const quantity = parsePositiveNumber(record.quantity, "cantidad");

  if (!marca) return { error: "La marca es obligatoria" };
  if (!color) return { error: "El color es obligatorio" };
  if (anchoCm === null) {
    return { error: "El ancho debe ser mayor a 0 cm" };
  }
  if (largoCm === null) {
    return { error: "El largo debe ser mayor a 0 cm" };
  }
  if (quantity === null) {
    return { error: "La cantidad debe ser mayor a 0" };
  }

  return {
    type,
    marca,
    color,
    anchoCm,
    largoCm,
    price,
    quantity,
    compradoPor,
  };
}

export function validateCreateStockEntry(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Datos inválidos" };
  }

  const record = body as Record<string, unknown>;
  const type = record.type;

  if (typeof type !== "string" || !ALL_STOCK_TYPES.includes(type as MaterialType)) {
    return { ok: false, error: "Tipo de material inválido" };
  }

  const price = parsePositiveNumber(record.price, "precio");
  if (price === null) {
    return { ok: false, error: "El precio debe ser mayor a 0" };
  }

  const compradoPor = parseCompradoPor(record.compradoPor);
  if (!compradoPor) {
    return { ok: false, error: "Seleccioná quién compró el material" };
  }

  if (type === "telas" || type === "guata") {
    const fabric = parseFabricLikeInput(
      record,
      type,
      price,
      compradoPor,
    );
    if ("error" in fabric) {
      return { ok: false, error: fabric.error };
    }
    return { ok: true, data: fabric };
  }

  if (type === "maderas") {
    const anchoCm = parsePositiveNumber(record.anchoCm, "ancho");
    const largoCm = parsePositiveNumber(record.largoCm, "largo");
    const quantity = parsePositiveNumber(record.quantity, "cantidad");
    const tipoMadera = record.tipoMadera;

    if (anchoCm === null) {
      return { ok: false, error: "El ancho debe ser mayor a 0 cm" };
    }
    if (largoCm === null) {
      return { ok: false, error: "El largo debe ser mayor a 0 cm" };
    }
    if (quantity === null) {
      return { ok: false, error: "La cantidad debe ser mayor a 0" };
    }
    if (
      typeof tipoMadera !== "string" ||
      !WOOD_TYPES.includes(tipoMadera as WoodType)
    ) {
      return { ok: false, error: "Tipo de madera inválido" };
    }

    return {
      ok: true,
      data: {
        type: "maderas",
        anchoCm,
        largoCm,
        quantity,
        price,
        tipoMadera: tipoMadera as WoodType,
        compradoPor,
      },
    };
  }

  if (type === "herramientas") {
    const descripcion = parseNonEmptyString(record.descripcion);
    const quantity = parsePositiveNumber(record.quantity, "cantidad");

    if (!descripcion) {
      return { ok: false, error: "La descripción es obligatoria" };
    }
    if (quantity === null) {
      return { ok: false, error: "La cantidad debe ser mayor a 0" };
    }

    return {
      ok: true,
      data: {
        type: "herramientas",
        descripcion,
        quantity,
        price,
        compradoPor,
      },
    };
  }

  if (type === "cano_pvc") {
    const anchoMm = parsePositiveNumber(record.anchoMm, "ancho");
    const largoCm = parsePositiveNumber(record.largoCm, "largo");
    const quantity = parsePositiveNumber(record.quantity, "cantidad");

    if (anchoMm === null) {
      return { ok: false, error: "El ancho debe ser mayor a 0 mm" };
    }
    if (largoCm === null) {
      return { ok: false, error: "El largo debe ser mayor a 0 cm" };
    }
    if (quantity === null) {
      return { ok: false, error: "La cantidad debe ser mayor a 0" };
    }

    return {
      ok: true,
      data: { type: "cano_pvc", anchoMm, largoCm, quantity, price, compradoPor },
    };
  }

  return { ok: false, error: "Tipo de material inválido" };
}

export function validateUpdateStockEntry(
  id: unknown,
  body: unknown,
): ValidationResult | { ok: false; error: string } {
  if (typeof id !== "string" || !id.trim()) {
    return { ok: false, error: "ID inválido" };
  }

  const validation = validateCreateStockEntry(body);
  if (!validation.ok) return validation;

  return validation;
}
