import { NextResponse } from "next/server";
import { requireSession, requireWriteEnsambleSession } from "@/lib/auth/api";
import { canEditEnsamble } from "@/lib/ensamble/permissions";
import {
  deleteEnsamble,
  getEnsambleById,
  updateEnsamble,
} from "@/lib/ensamble/ensamble-storage";
import { validateUpdateEnsamble } from "@/lib/ensamble/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;
  const ensamble = await getEnsambleById(id);

  if (!ensamble) {
    return NextResponse.json(
      { error: "Ensamble no encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json(ensamble);
}

export async function PATCH(request: Request, context: RouteContext) {
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

  const existing = await getEnsambleById(id);
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
    const ensamble = await updateEnsamble(id, validation.data);
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

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireWriteEnsambleSession();
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;

  const existing = await getEnsambleById(id);
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

  const deleted = await deleteEnsamble(id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Ensamble no encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
