import { getFirestore, type DocumentData } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { CM_PER_METER } from "./meter-based";
import { defaultUsarEnProductos } from "./constants";
import { superficieCm2FromDimensions } from "./superficie";
import type { CreateStockEntryInput, MaterialType, StockEntry } from "./types";

const COLLECTION = "taller-stock";

function getCollection() {
  return getFirestore(getFirebaseAdmin()).collection(COLLECTION);
}

function buildEntry(
  id: string,
  input: CreateStockEntryInput,
  updatedAt: string,
): StockEntry {
  const base = {
    id,
    updatedAt,
    price: input.price,
    quantity: input.quantity,
    cantidadUsada: input.cantidadUsada ?? 0,
    compradoPor: input.compradoPor,
    usarEnProductos: input.usarEnProductos ?? defaultUsarEnProductos(input.type),
  };

  switch (input.type) {
    case "telas":
      return {
        ...base,
        type: "telas",
        descripcion: input.descripcion,
        anchoCm: input.anchoCm,
        largoCm: input.largoCm,
        superficieCm2: input.superficieCm2,
        color: input.color,
        cortes: input.cortes,
      };
    case "guata":
      return {
        ...base,
        type: "guata",
        descripcion: input.descripcion,
        anchoCm: input.anchoCm,
        largoCm: input.largoCm,
        color: input.color,
      };
    case "hilo":
      return {
        ...base,
        type: "hilo",
        descripcion: input.descripcion,
        largoCm: input.largoCm,
      };
    case "maderas":
      return {
        ...base,
        type: "maderas",
        anchoCm: input.anchoCm,
        largoCm: input.largoCm,
        superficieCm2: input.superficieCm2,
        tipoMadera: input.tipoMadera,
        cortes: input.cortes,
      };
    case "cano":
      return {
        ...base,
        type: "cano",
        descripcion: input.descripcion,
        largoCm: input.largoCm,
      };
    case "herramientas":
      return {
        ...base,
        type: "herramientas",
        descripcion: input.descripcion,
      };
  }
}

function isValidStockEntry(value: unknown): value is StockEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.type === "string" &&
    typeof entry.price === "number" &&
    typeof entry.quantity === "number" &&
    typeof entry.updatedAt === "string" &&
    typeof entry.compradoPor === "string"
  );
}

/** Convierte registros legacy (precio/metro, cantidad en metros) a precio/cm. */
function normalizeCanoDocument(data: DocumentData): void {
  if (data.type === "cano_pvc") {
    data.type = "cano";
  }
  if (data.type !== "cano") return;

  const largoCm = Number(data.largoCm);
  const quantity = Number(data.quantity);
  const price = Number(data.price);
  if (!Number.isFinite(largoCm) || largoCm <= 0 || !Number.isFinite(price)) {
    return;
  }

  const legacyMeters = largoCm / CM_PER_METER;
  const isLegacyQuantity =
    Number.isFinite(quantity) &&
    quantity > 0 &&
    Math.abs(quantity - legacyMeters) < 0.0001;

  if (!isLegacyQuantity) {
    if (!Number.isFinite(quantity) || Math.abs(quantity - largoCm) > 0.01) {
      data.quantity = largoCm;
    }
    return;
  }

  data.price = price / CM_PER_METER;
  data.quantity = largoCm;

  const used = Number(data.cantidadUsada);
  if (Number.isFinite(used) && used > 0 && used < largoCm) {
    data.cantidadUsada = used * CM_PER_METER;
  }

  if (
    typeof data.descripcion !== "string" ||
    !data.descripcion.trim()
  ) {
    const anchoMm = Number(data.anchoMm);
    if (Number.isFinite(anchoMm) && anchoMm > 0) {
      data.descripcion = `Ø ${anchoMm} mm`;
    } else {
      data.descripcion = "Caño";
    }
  }
}

function docToEntry(id: string, data: DocumentData): StockEntry | null {
  const normalized = { ...data };

  normalizeCanoDocument(normalized);

  if (typeof normalized.usarEnProductos !== "boolean") {
    normalized.usarEnProductos = defaultUsarEnProductos(
      normalized.type as MaterialType,
    );
  }

  if (
    (normalized.type === "telas" || normalized.type === "guata") &&
    typeof normalized.marca === "string" &&
    !normalized.descripcion
  ) {
    normalized.descripcion = normalized.marca;
  }

  if (
    normalized.cantidadUsada === undefined ||
    normalized.cantidadUsada === null
  ) {
    normalized.cantidadUsada = 0;
  }

  if (normalized.type === "maderas" || normalized.type === "telas") {
    if (
      typeof normalized.anchoCm === "number" &&
      typeof normalized.largoCm === "number" &&
      (normalized.superficieCm2 === undefined ||
        normalized.superficieCm2 === null ||
        typeof normalized.superficieCm2 !== "number")
    ) {
      normalized.superficieCm2 = superficieCm2FromDimensions(
        normalized.anchoCm,
        normalized.largoCm,
      );
    }
    if (!Array.isArray(normalized.cortes)) {
      normalized.cortes = [];
    }
  }

  const entry = { id, ...normalized };
  return isValidStockEntry(entry) ? entry : null;
}

export async function getStockEntries(): Promise<StockEntry[]> {
  const snapshot = await getCollection().get();
  const entries = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return data ? docToEntry(doc.id, data) : null;
    })
    .filter((entry): entry is StockEntry => entry !== null);

  return entries.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getStockEntryById(
  id: string,
): Promise<StockEntry | null> {
  const doc = await getCollection().doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;
  return docToEntry(doc.id, data);
}

export async function addStockEntry(
  input: CreateStockEntryInput,
): Promise<StockEntry> {
  const newEntry = buildEntry(
    crypto.randomUUID(),
    input,
    new Date().toISOString(),
  );
  await getCollection().doc(newEntry.id).set(newEntry);
  return newEntry;
}

export async function updateStockEntry(
  id: string,
  input: CreateStockEntryInput,
): Promise<StockEntry | null> {
  const existing = await getStockEntryById(id);
  if (!existing) return null;

  const updated = buildEntry(id, input, new Date().toISOString());
  await getCollection().doc(id).set(updated);
  return updated;
}
