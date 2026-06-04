import { ALL_STOCK_TYPES, BUYER_TYPES, WOOD_TYPES, defaultUsarEnProductos } from "./constants";
import {
  isValidLengthCm,
  quantityFromLengthCm,
} from "./meter-based";
import {
  getMaderaStockCm2,
  getTelaStockCm2,
  totalSuperficieCortesUsadaCm2,
} from "./cortes";
import { superficieCm2FromDimensions } from "./superficie";
import type {
  BuyerType,
  CreateGuataInput,
  CreateHiloInput,
  CreateMaderaInput,
  CreateStockEntryInput,
  CreateTelaInput,
  MaterialType,
  StockCorte,
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

type TelaInputBase = Omit<
  CreateTelaInput,
  "superficieCm2" | "cortes" | "cantidadUsada"
>;

function parseTelaInput(
  record: Record<string, unknown>,
  price: number,
  compradoPor: BuyerType,
): TelaInputBase | { error: string } {
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
    type: "telas",
    descripcion,
    color,
    anchoCm,
    largoCm,
    price,
    quantity: quantityFromLengthCm(largoCm),
    compradoPor,
  };
}

function parseGuataInput(
  record: Record<string, unknown>,
  price: number,
  compradoPor: BuyerType,
): CreateGuataInput | { error: string } {
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
    type: "guata",
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

function parseCortes(value: unknown): StockCorte[] | { error: string } {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    return { error: "Los cortes son inválidos" };
  }

  const cortes: StockCorte[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      return { error: "Cada corte debe ser un objeto válido" };
    }
    const corte = item as Record<string, unknown>;
    const id =
      typeof corte.id === "string" && corte.id.trim()
        ? corte.id.trim()
        : crypto.randomUUID();
    const anchoCm = parsePositiveNumber(corte.anchoCm, "ancho");
    const largoCm = parsePositiveNumber(corte.largoCm, "largo");

    if (anchoCm === null) {
      return { error: "Cada corte debe tener ancho mayor a 0 cm" };
    }
    if (largoCm === null) {
      return { error: "Cada corte debe tener largo mayor a 0 cm" };
    }

    cortes.push({ id, anchoCm, largoCm });
  }

  return cortes;
}

function parseUsarEnProductos(
  record: Record<string, unknown>,
  type: MaterialType,
): boolean {
  if (typeof record.usarEnProductos === "boolean") {
    return record.usarEnProductos;
  }
  return defaultUsarEnProductos(type);
}

function finalizeInput(
  data: CreateStockEntryInput,
  record: Record<string, unknown>,
  usarEnProductos: boolean,
): ValidationResult {
  const cantidadUsada = parseCantidadUsada(record.cantidadUsada, data.quantity);
  if (typeof cantidadUsada === "object") {
    return { ok: false, error: cantidadUsada.error };
  }
  return { ok: true, data: { ...data, cantidadUsada, usarEnProductos } };
}

function finalizeWithCortes<T extends CreateMaderaInput | CreateTelaInput>(
  data: T,
  record: Record<string, unknown>,
  getStockCm2: (data: T) => number,
  usarEnProductos: boolean,
): ValidationResult {
  const cortes = parseCortes(record.cortes);
  if ("error" in cortes) {
    return { ok: false, error: cortes.error };
  }

  const stockCm2 = getStockCm2(data);
  const usedCm2 = totalSuperficieCortesUsadaCm2(cortes);

  if (usedCm2 > stockCm2) {
    return {
      ok: false,
      error: "La superficie de los cortes supera el stock disponible",
    };
  }

  return {
    ok: true,
    data: {
      ...data,
      cortes,
      cantidadUsada: usedCm2,
      usarEnProductos,
    } as CreateStockEntryInput,
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

  const usarEnProductos = parseUsarEnProductos(record, type as MaterialType);

  if (type === "telas") {
    const tela = parseTelaInput(record, price, compradoPor);
    if ("error" in tela) {
      return { ok: false, error: tela.error };
    }
    return finalizeWithCortes(
      {
        ...tela,
        superficieCm2: superficieCm2FromDimensions(tela.anchoCm, tela.largoCm),
        cortes: [],
      },
      record,
      getTelaStockCm2,
      usarEnProductos,
    );
  }

  if (type === "guata") {
    const guata = parseGuataInput(record, price, compradoPor);
    if ("error" in guata) {
      return { ok: false, error: guata.error };
    }
    return finalizeInput(guata, record, usarEnProductos);
  }

  if (type === "hilo") {
    const hilo = parseHiloInput(record, price, compradoPor);
    if ("error" in hilo) {
      return { ok: false, error: hilo.error };
    }
    return finalizeInput(hilo, record, usarEnProductos);
  }

  if (type === "maderas") {
    const descripcion = parseNonEmptyString(record.descripcion);
    const anchoCm = parsePositiveNumber(record.anchoCm, "ancho");
    const largoCm = parsePositiveNumber(record.largoCm, "largo");
    const quantity = parsePositiveNumber(record.quantity, "cantidad");
    const tipoMadera = record.tipoMadera;

    if (!descripcion) {
      return { ok: false, error: "Ingresá la descripción de la madera." };
    }
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

    return finalizeWithCortes(
      {
        type: "maderas",
        descripcion,
        anchoCm,
        largoCm,
        superficieCm2: superficieCm2FromDimensions(anchoCm, largoCm),
        quantity,
        price,
        tipoMadera: tipoMadera as WoodType,
        compradoPor,
        cortes: [],
      },
      record,
      getMaderaStockCm2,
      usarEnProductos,
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
      usarEnProductos,
    );
  }

  if (type === "cano") {
    const descripcion = parseNonEmptyString(record.descripcion);
    const largoCm = parseLengthCm(record.largoCm);

    if (!descripcion) {
      return { ok: false, error: "Ingresá la descripción del caño." };
    }
    if (largoCm === null) {
      return { ok: false, error: "El largo debe ser mayor a 100 cm" };
    }

    return finalizeInput(
      {
        type: "cano",
        descripcion,
        largoCm,
        quantity: largoCm,
        price,
        compradoPor,
      },
      record,
      usarEnProductos,
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
