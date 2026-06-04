import { NextResponse } from "next/server";
import { requireSession, requireWriteEnsambleSession } from "@/lib/auth/api";
import { addEnsamble, getEnsambles } from "@/lib/ensamble/ensamble-storage";
import { validateCreateEnsamble } from "@/lib/ensamble/validation";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const ensambles = await getEnsambles();
  return NextResponse.json(ensambles);
}

export async function POST(request: Request) {
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
    const ensamble = await addEnsamble(validation.data, session.username);
    return NextResponse.json(ensamble, { status: 201 });
  } catch (error) {
    console.error("addEnsamble", error);
    return NextResponse.json(
      { error: "No se pudo guardar el ensamble en Firebase." },
      { status: 500 },
    );
  }
}
