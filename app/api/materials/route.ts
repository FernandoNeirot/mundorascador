import { NextResponse } from "next/server";
import { requireSession, requireWriteSession } from "@/lib/auth/api";
import { addStockEntry, getStockEntries } from "@/lib/materials/stock-storage";
import { validateCreateStockEntry } from "@/lib/materials/validation";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const entries = await getStockEntries();
  return NextResponse.json(entries);
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

  const validation = validateCreateStockEntry(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const entry = await addStockEntry(validation.data);
  return NextResponse.json(entry, { status: 201 });
}
