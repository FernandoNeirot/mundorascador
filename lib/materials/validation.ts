import { ALL_STOCK_TYPES, BUYER_TYPES, WOOD_TYPES } from "./constants";
import {
  isValidLengthCm,
  quantityFromLengthCm,
} from "./meter-based";
import type {
  BuyerType,
  CreateFabricLikeInput,
  CreateHiloInput,
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

function parseLengthCm(value: unknown): number | null {
  const largoCm = parsePositiveNumber(value, "largo");
  if (largoCm === null || !isValidLengthCm(largoCm)) {
    return null;
  }
  return largoCm;
}

function parseFabricLikeInput(
  record: Record<string, unknown>,
  type: FabricLikeType,
  price: number,
  compradoPor: BuyerType,
): CreateFabricLikeInput | { error: string } {
  const descripcion = parseNonEmptyString(record.descripcion);
  const color = parseNonEmptyString(record.color);
  const anchoCm = parsePositiveNumber(record.anchoCm, "ancho");
  const largoCm = parseLengthCm(record.largoCm);

  if (!descripcion) return { error: "La descripción es obligatoria" };
  if (!color) return { error: "El color es obligatorio" };
  if (anchoCm === null) {
    return { error: "El ancho debe ser mayor a 0 cm" };
  }
  if (largoCm === null) {
    return { error: "El largo debe ser mayor a 100 cm" };
  }

  return {
    type,
    descripcion,
    color,
    anchoCm,
    largoCm,
    price,
    quantity: quantityFromLengthCm(largoCm),
    compradoPor,
  };
}

function parseHiloInput(
  record: Record<string, unknown>,
  price: number,
  compradoPor: BuyerType,
): CreateHiloInput | { error: string } {
  const descripcion = parseNonEmptyString(record.descripcion);
  const largoCm = parseLengthCm(record.largoCm);

  if (!descripcion) {
    return { error: "La descripción es obligatoria" };
  }
  if (largoCm === null) {
    return { error: "El largo debe ser mayor a 100 cm" };
  }

  return {
    type: "hilo",
    descripcion,
    largoCm,
    price,
    quantity: quantityFromLengthCm(largoCm),
    compradoPor,
  };
}

function parseCantidadUsada(
  value: unknown,
  quantity: number,
): number | { error: string } {
  if (value === undefined || value === null) {
    return 0;
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return { error: "La cantidad usada debe ser 0 o mayor" };
  }
  if (value > quantity) {
    return {
      error: "La cantidad usada no puede superar la cantidad en stock",
    };
  }
  return value;
}

function finalizeInput(
  data: CreateStockEntryInput,
  record: Record<string, unknown>,
): ValidationResult {
  const cantidadUsada = parseCantidadUsada(record.cantidadUsada, data.quantity);
  if (typeof cantidadUsada === "object") {
    return { ok: false, error: cantidadUsada.error };
  }
  return { ok: true, data: { ...data, cantidadUsada } };
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
    return finalizeInput(fabric, record);
  }

  if (type === "hilo") {
    const hilo = parseHiloInput(record, price, compradoPor);
    if ("error" in hilo) {
      return { ok: false, error: hilo.error };
    }
    return finalizeInput(hilo, record);
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

    return finalizeInput(
      {
        type: "maderas",
        anchoCm,
        largoCm,
        quantity,
        price,
        tipoMadera: tipoMadera as WoodType,
        compradoPor,
      },
      record,
    );
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

    return finalizeInput(
      {
        type: "herramientas",
        descripcion,
        quantity,
        price,
        compradoPor,
      },
      record,
    );
  }

  if (type === "cano_pvc") {
    const anchoMm = parsePositiveNumber(record.anchoMm, "ancho");
    const largoCm = parseLengthCm(record.largoCm);

    if (anchoMm === null) {
      return { ok: false, error: "El ancho debe ser mayor a 0 mm" };
    }
    if (largoCm === null) {
      return { ok: false, error: "El largo debe ser mayor a 100 cm" };
    }

    return finalizeInput(
      {
        type: "cano_pvc",
        anchoMm,
        largoCm,
        quantity: quantityFromLengthCm(largoCm),
        price,
        compradoPor,
      },
      record,
    );
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
