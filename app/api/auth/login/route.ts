import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/users";
import {
  createSessionToken,
  getSessionCookieOptions,
} from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { username, password } = body as {
    username?: string;
    password?: string;
  };

  if (!username?.trim() || !password) {
    return NextResponse.json(
      { error: "Usuario y contraseña son obligatorios" },
      { status: 400 },
    );
  }

  const user = await authenticateUser(username, password);
  if (!user) {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 },
    );
  }

  const token = await createSessionToken(user);
  const response = NextResponse.json({
    username: user.username,
    role: user.role,
  });

  response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());
  return response;
}
