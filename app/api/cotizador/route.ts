import { NextResponse } from "next/server";
import { requireSession, requireWriteSession } from "@/lib/auth/api";
import {
  addCotizacion,
  getCotizaciones,
} from "@/lib/cotizador/quote-storage";
import { validateCreateCotizacion } from "@/lib/cotizador/validation";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const cotizaciones = await getCotizaciones();
  return NextResponse.json(cotizaciones);
}

export async function POST(request: Request) {
  const session = await requireWriteSession();
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

  const cotizacion = await addCotizacion(validation.data, session.username);
  return NextResponse.json(cotizacion, { status: 201 });
}
