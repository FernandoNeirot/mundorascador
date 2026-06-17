import { NextResponse } from "next/server";
import { requireSession, requireWriteSession } from "@/lib/auth/api";
import { validateCreateStockEntry, validateUpdateStockEntry } from "@/lib/materials/validation";
import type { AdminTenant } from "../config";
import { getTenantStorage } from "../storage";

export function createMaterialsRoutes(tenant: AdminTenant) {
  const storage = getTenantStorage(tenant.id).stock;

  async function GET() {
    const session = await requireSession();
    if (session instanceof NextResponse) return session;

    const entries = await storage.getStockEntries();
    return NextResponse.json(entries);
  }

  async function POST(request: Request) {
    const session = await requireWriteSession();
    if (session instanceof NextResponse) return session;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const validation = validateCreateStockEntry(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const entry = await storage.addStockEntry(validation.data);
    return NextResponse.json(entry, { status: 201 });
  }

  return { GET, POST };
}

export function createMaterialsByIdRoutes(tenant: AdminTenant) {
  const storage = getTenantStorage(tenant.id).stock;

  async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> },
  ) {
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

    const existing = await storage.getStockEntryById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 },
      );
    }

    const entry = await storage.updateStockEntry(id, validation.data);
    if (!entry) {
      return NextResponse.json(
        { error: "No se pudo actualizar" },
        { status: 500 },
      );
    }

    return NextResponse.json(entry);
  }

  return { PATCH };
}
