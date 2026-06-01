import { getFirestore, type DocumentData } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import type {
  Cotizacion,
  CreateCotizacionInput,
  UpdateCotizacionInput,
} from "./types";

const COLLECTION = "taller-cotizador";

function getCollection() {
  return getFirestore(getFirebaseAdmin()).collection(COLLECTION);
}

function isValidCotizacion(value: unknown): value is Cotizacion {
  if (!value || typeof value !== "object") return false;
  const doc = value as Record<string, unknown>;
  return (
    typeof doc.id === "string" &&
    typeof doc.nombre === "string" &&
    typeof doc.descripcion === "string" &&
    Array.isArray(doc.materiales) &&
    typeof doc.createdAt === "string" &&
    typeof doc.updatedAt === "string" &&
    typeof doc.createdBy === "string"
  );
}

function docToCotizacion(id: string, data: DocumentData): Cotizacion | null {
  const normalized = {
    id,
    ...data,
    materiales: Array.isArray(data.materiales) ? data.materiales : [],
    descripcion:
      typeof data.descripcion === "string" ? data.descripcion : "",
  };

  return isValidCotizacion(normalized) ? normalized : null;
}

export async function getCotizaciones(): Promise<Cotizacion[]> {
  const snapshot = await getCollection().get();
  const cotizaciones = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return data ? docToCotizacion(doc.id, data) : null;
    })
    .filter((item): item is Cotizacion => item !== null);

  return cotizaciones.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getCotizacionById(id: string): Promise<Cotizacion | null> {
  const doc = await getCollection().doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;
  return docToCotizacion(doc.id, data);
}

export async function addCotizacion(
  input: CreateCotizacionInput,
  createdBy: string,
): Promise<Cotizacion> {
  const now = new Date().toISOString();
  const cotizacion: Cotizacion = {
    id: crypto.randomUUID(),
    nombre: input.nombre,
    descripcion: input.descripcion,
    materiales: input.materiales ?? [],
    createdAt: now,
    updatedAt: now,
    createdBy,
  };

  await getCollection().doc(cotizacion.id).set(cotizacion);
  return cotizacion;
}

export async function updateCotizacion(
  id: string,
  input: UpdateCotizacionInput,
): Promise<Cotizacion | null> {
  const existing = await getCotizacionById(id);
  if (!existing) return null;

  const updated: Cotizacion = {
    ...existing,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await getCollection().doc(id).set(updated);
  return updated;
}

export async function deleteCotizacion(id: string): Promise<boolean> {
  const existing = await getCotizacionById(id);
  if (!existing) return false;

  await getCollection().doc(id).delete();
  return true;
}
