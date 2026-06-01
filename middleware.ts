import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { canReadStock, canWriteStock } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/types";

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET no está configurado.");
  }
  return new TextEncoder().encode(secret);
}

async function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const username = payload.username;
    const role = payload.role;

    if (
      typeof username !== "string" ||
      (role !== "superadmin" && role !== "admin" && role !== "readonly")
    ) {
      return null;
    }

    return { username, role: role as UserRole };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSessionFromRequest(request);

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (pathname.startsWith("/login")) {
    if (session && canReadStock(session.role)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!session || !canReadStock(session.role)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/materials") || pathname.startsWith("/api/cotizador")) {
    if (!session || !canReadStock(session.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const isWriteMethod =
      request.method === "POST" ||
      request.method === "PATCH" ||
      request.method === "PUT" ||
      request.method === "DELETE";

    if (isWriteMethod && !canWriteStock(session)) {
      return NextResponse.json({ error: "Permiso denegado" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/login", "/api/materials/:path*", "/api/cotizador/:path*"],
};
