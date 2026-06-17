import { NextResponse } from "next/server";
import {
  requireSession,
  requireWriteCotizadorSession,
} from "@/lib/auth/api";
import { canEditCotizacion } from "@/lib/cotizador/permissions";
import {
  validateCreateCotizacion,
  validateUpdateCotizacion,
} from "@/lib/cotizador/validation";
import type { AdminTenant } from "../config";
import { getTenantStorage } from "../storage";

export function createCotizadorRoutes(tenant: AdminTenant) {
  const storage = getTenantStorage(tenant.id).cotizador;

  async function GET() {
    const session = await requireSession();
    if (session instanceof NextResponse) return session;

    const cotizaciones = await storage.getCotizaciones();
    return NextResponse.json(cotizaciones);
  }

  async function POST(request: Request) {
    const session = await requireWriteCotizadorSession();
    if (session instanceof NextResponse) return session;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const validation = validateCreateCotizacion(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const cotizacion = await storage.addCotizacion(
      validation.data,
      session.username,
    );
    return NextResponse.json(cotizacion, { status: 201 });
  }

  return { GET, POST };
}

export function createCotizadorByIdRoutes(tenant: AdminTenant) {
  const storage = getTenantStorage(tenant.id).cotizador;

  async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> },
  ) {
    const session = await requireSession();
    if (session instanceof NextResponse) return session;

    const { id } = await context.params;
    const cotizacion = await storage.getCotizacionById(id);

    if (!cotizacion) {
      return NextResponse.json(
        { error: "Cotización no encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json(cotizacion);
  }

  async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> },
  ) {
    const session = await requireWriteCotizadorSession();
    if (session instanceof NextResponse) return session;

    const { id } = await context.params;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const validation = validateUpdateCotizacion(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const existing = await storage.getCotizacionById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Cotización no encontrada." },
        { status: 404 },
      );
    }

    if (!canEditCotizacion(session, existing)) {
      return NextResponse.json(
        { error: "No tenés permiso para editar esta cotización." },
        { status: 403 },
      );
    }

    const cotizacion = await storage.updateCotizacion(id, validation.data);
    if (!cotizacion) {
      return NextResponse.json(
        { error: "Cotización no encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json(cotizacion);
  }

  async function DELETE(
    _request: Request,
    context: { params: Promise<{ id: string }> },
  ) {
    const session = await requireWriteCotizadorSession();
    if (session instanceof NextResponse) return session;

    const { id } = await context.params;

    const existing = await storage.getCotizacionById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Cotización no encontrada." },
        { status: 404 },
      );
    }

    if (!canEditCotizacion(session, existing)) {
      return NextResponse.json(
        { error: "No tenés permiso para eliminar esta cotización." },
        { status: 403 },
      );
    }

    const deleted = await storage.deleteCotizacion(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Cotización no encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  }

  return { GET, PATCH, DELETE };
}
