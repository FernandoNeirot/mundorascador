import { getFirestore, type DocumentData } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { parseMateriales } from "@/lib/cotizador/validation";
import {
  EMPTY_RASCADOR_CONFIG,
  normalizeConfigPisosOrder,
} from "./cat-scratcher";
import {
  DEFAULT_ENSAMBLE_COTIZACION_PREFS,
  normalizeEnsambleCotizacionPrefs,
} from "./cotizacion-prefs";
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

function docToEnsamble(id: string, data: DocumentData): Ensamble | null {
  if (!data || typeof data !== "object") return null;
  const doc = data as Record<string, unknown>;
  if (doc.tipo !== "rascador-gatos") return null;
  if (!isValidRascadorConfig(doc.config)) return null;
  if (typeof doc.createdAt !== "string" || typeof doc.updatedAt !== "string") {
    return null;
  }
  if (typeof doc.createdBy !== "string") return null;

  const materialesRaw = parseMateriales(doc.materiales ?? []);
  const materiales = typeof materialesRaw === "string" ? [] : materialesRaw;

  return {
    id,
    tipo: "rascador-gatos",
    config: normalizeConfigPisosOrder(doc.config),
    descripcion:
      typeof doc.descripcion === "string" ? doc.descripcion : "",
    materiales,
    cotizacionPrefs: normalizeEnsambleCotizacionPrefs(doc.cotizacionPrefs),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    createdBy: doc.createdBy,
  };
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
  const materialesInput = parseMateriales(input.materiales ?? []);
  const materiales =
    typeof materialesInput === "string" ? [] : materialesInput;

  const ensamble: Ensamble = {
    id: crypto.randomUUID(),
    tipo,
    config,
    descripcion: input.descripcion?.trim() ?? "",
    materiales,
    cotizacionPrefs: normalizeEnsambleCotizacionPrefs(
      input.cotizacionPrefs ?? DEFAULT_ENSAMBLE_COTIZACION_PREFS,
    ),
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

  const materiales =
    input.materiales === undefined
      ? existing.materiales
      : (() => {
          const parsed = parseMateriales(input.materiales);
          return typeof parsed === "string" ? existing.materiales : parsed;
        })();

  const updated: Ensamble = {
    ...existing,
    config: input.config
      ? normalizeConfigPisosOrder(input.config)
      : existing.config,
    descripcion:
      input.descripcion !== undefined
        ? input.descripcion.trim()
        : existing.descripcion,
    materiales,
    cotizacionPrefs:
      input.cotizacionPrefs !== undefined
        ? normalizeEnsambleCotizacionPrefs(input.cotizacionPrefs)
        : existing.cotizacionPrefs,
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
