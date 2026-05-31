import { NextResponse } from "next/server";
import { canReadStock, canWriteStock } from "./permissions";
import { getSessionFromCookies } from "./session";
import type { SessionUser } from "./types";

export async function requireSession(): Promise<
  SessionUser | NextResponse
> {
  const session = await getSessionFromCookies();
  if (!session || !canReadStock(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return session;
}

export async function requireWriteSession(): Promise<
  SessionUser | NextResponse
> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  if (!canWriteStock(session)) {
    return NextResponse.json({ error: "Permiso denegado" }, { status: 403 });
  }

  return session;
}
