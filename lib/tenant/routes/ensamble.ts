import { NextResponse } from "next/server";
import {
  requireSession,
  requireWriteEnsambleSession,
} from "@/lib/auth/api";
import { canEditEnsamble } from "@/lib/ensamble/permissions";
import {
  validateCreateEnsamble,
  validateUpdateEnsamble,
} from "@/lib/ensamble/validation";
import type { AdminTenant } from "../config";
import { getTenantStorage } from "../storage";

export function createEnsambleRoutes(tenant: AdminTenant) {
  const storage = getTenantStorage(tenant.id).ensambles;

  async function GET() {
    const session = await requireSession();
    if (session instanceof NextResponse) return session;

    const ensambles = await storage.getEnsambles();
    return NextResponse.json(ensambles);
  }

  async function POST(request: Request) {
    const session = await requireWriteEnsambleSession();
    if (session instanceof NextResponse) return session;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const validation = validateCreateEnsamble(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    try {
      const ensamble = await storage.addEnsamble(
        validation.data,
        session.username,
      );
      return NextResponse.json(ensamble, { status: 201 });
    } catch (error) {
      console.error("addEnsamble", error);
      return NextResponse.json(
        { error: "No se pudo guardar el ensamble en Firebase." },
        { status: 500 },
      );
    }
  }

  return { GET, POST };
}

export function createEnsambleByIdRoutes(tenant: AdminTenant) {
  const storage = getTenantStorage(tenant.id).ensambles;

  async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> },
  ) {
    const session = await requireSession();
    if (session instanceof NextResponse) return session;

    const { id } = await context.params;
    const ensamble = await storage.getEnsambleById(id);

    if (!ensamble) {
      return NextResponse.json(
        { error: "Ensamble no encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json(ensamble);
  }

  async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> },
  ) {
    const session = await requireWriteEnsambleSession();
    if (session instanceof NextResponse) return session;

    const { id } = await context.params;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const validation = validateUpdateEnsamble(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const existing = await storage.getEnsambleById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Ensamble no encontrado." },
        { status: 404 },
      );
    }

    if (!canEditEnsamble(session, existing)) {
      return NextResponse.json(
        { error: "No tenés permiso para editar este ensamble." },
        { status: 403 },
      );
    }

    try {
      const ensamble = await storage.updateEnsamble(id, validation.data);
      if (!ensamble) {
        return NextResponse.json(
          { error: "Ensamble no encontrado." },
          { status: 404 },
        );
      }

      return NextResponse.json(ensamble);
    } catch (error) {
      console.error("updateEnsamble", error);
      return NextResponse.json(
        { error: "No se pudo guardar el ensamble en Firebase." },
        { status: 500 },
      );
    }
  }

  async function DELETE(
    _request: Request,
    context: { params: Promise<{ id: string }> },
  ) {
    const session = await requireWriteEnsambleSession();
    if (session instanceof NextResponse) return session;

    const { id } = await context.params;

    const existing = await storage.getEnsambleById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Ensamble no encontrado." },
        { status: 404 },
      );
    }

    if (!canEditEnsamble(session, existing)) {
      return NextResponse.json(
        { error: "No tenés permiso para eliminar este ensamble." },
        { status: 403 },
      );
    }

    const deleted = await storage.deleteEnsamble(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Ensamble no encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  }

  return { GET, PATCH, DELETE };
}
