import { getFirestore, type DocumentData } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import {
  EMPTY_RASCADOR_CONFIG,
  normalizeConfigPisosOrder,
} from "./cat-scratcher";
import { isValidRascadorConfig } from "./validation";
import type {
  CreateEnsambleInput,
  Ensamble,
  EnsambleTipo,
  UpdateEnsambleInput,
} from "./types";

const COLLECTION = "taller-ensambles";

function getCollection() {
  return getFirestore(getFirebaseAdmin()).collection(COLLECTION);
}

function isValidEnsamble(value: unknown): value is Ensamble {
  if (!value || typeof value !== "object") return false;
  const doc = value as Record<string, unknown>;
  return (
    typeof doc.id === "string" &&
    doc.tipo === "rascador-gatos" &&
    isValidRascadorConfig(doc.config) &&
    typeof doc.createdAt === "string" &&
    typeof doc.updatedAt === "string" &&
    typeof doc.createdBy === "string"
  );
}

function docToEnsamble(id: string, data: DocumentData): Ensamble | null {
  const normalized = { id, ...data };
  return isValidEnsamble(normalized) ? normalized : null;
}

export async function getEnsambles(): Promise<Ensamble[]> {
  const snapshot = await getCollection().get();
  const items = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return data ? docToEnsamble(doc.id, data) : null;
    })
    .filter((item): item is Ensamble => item !== null);

  return items.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getEnsambleById(id: string): Promise<Ensamble | null> {
  const doc = await getCollection().doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;
  return docToEnsamble(doc.id, data);
}

export async function addEnsamble(
  input: CreateEnsambleInput,
  createdBy: string,
): Promise<Ensamble> {
  const now = new Date().toISOString();
  const tipo: EnsambleTipo = input.tipo ?? "rascador-gatos";
  const config = normalizeConfigPisosOrder(
    input.config ?? EMPTY_RASCADOR_CONFIG,
  );

  const ensamble: Ensamble = {
    id: crypto.randomUUID(),
    tipo,
    config,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };

  await getCollection().doc(ensamble.id).set(ensamble);
  return ensamble;
}

export async function updateEnsamble(
  id: string,
  input: UpdateEnsambleInput,
): Promise<Ensamble | null> {
  const existing = await getEnsambleById(id);
  if (!existing) return null;

  const updated: Ensamble = {
    ...existing,
    config: normalizeConfigPisosOrder(input.config),
    updatedAt: new Date().toISOString(),
  };

  await getCollection().doc(id).set(updated);
  return updated;
}

export async function deleteEnsamble(id: string): Promise<boolean> {
  const existing = await getEnsambleById(id);
  if (!existing) return false;

  await getCollection().doc(id).delete();
  return true;
}
