import { getFirestore, type DocumentData } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import type { CreateStockEntryInput, StockEntry } from "./types";

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
  };

  switch (input.type) {
    case "telas":
      return {
        ...base,
        type: "telas",
        descripcion: input.descripcion,
        anchoCm: input.anchoCm,
        largoCm: input.largoCm,
        color: input.color,
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
        tipoMadera: input.tipoMadera,
      };
    case "cano_pvc":
      return {
        ...base,
        type: "cano_pvc",
        anchoMm: input.anchoMm,
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

function docToEntry(id: string, data: DocumentData): StockEntry | null {
  const normalized = { ...data };

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
