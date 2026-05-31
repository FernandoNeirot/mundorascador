import { NextResponse } from "next/server";
import { requireWriteSession } from "@/lib/auth/api";
import {
  getStockEntryById,
  updateStockEntry,
} from "@/lib/materials/stock-storage";
import { validateUpdateStockEntry } from "@/lib/materials/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireWriteSession();
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const validation = validateUpdateStockEntry(id, body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const existing = await getStockEntryById(id);
  if (!existing) {
    return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
  }

  const entry = await updateStockEntry(id, validation.data);
  if (!entry) {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }

  return NextResponse.json(entry);
}
