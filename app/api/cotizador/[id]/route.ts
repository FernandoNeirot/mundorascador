import { NextResponse } from "next/server";
import { requireSession, requireWriteCotizadorSession } from "@/lib/auth/api";
import { canEditCotizacion } from "@/lib/cotizador/permissions";
import {
  deleteCotizacion,
  getCotizacionById,
  updateCotizacion,
} from "@/lib/cotizador/quote-storage";
import { validateUpdateCotizacion } from "@/lib/cotizador/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;
  const cotizacion = await getCotizacionById(id);

  if (!cotizacion) {
    return NextResponse.json(
      { error: "Cotización no encontrada." },
      { status: 404 },
    );
  }

  return NextResponse.json(cotizacion);
}

export async function PATCH(request: Request, context: RouteContext) {
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

  const existing = await getCotizacionById(id);
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

  const cotizacion = await updateCotizacion(id, validation.data);
  if (!cotizacion) {
    return NextResponse.json(
      { error: "Cotización no encontrada." },
      { status: 404 },
    );
  }

  return NextResponse.json(cotizacion);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireWriteCotizadorSession();
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;

  const existing = await getCotizacionById(id);
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

  const deleted = await deleteCotizacion(id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Cotización no encontrada." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
