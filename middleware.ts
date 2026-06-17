import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import {
  canReadStock,
  canWriteCotizador,
  canWriteEnsamble,
  canWriteStock,
} from "@/lib/auth/permissions";
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

function protectAdminArea(
  request: NextRequest,
  session: Awaited<ReturnType<typeof getSessionFromRequest>>,
) {
  if (!session || !canReadStock(session.role)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

function protectMaterialsApi(
  request: NextRequest,
  session: Awaited<ReturnType<typeof getSessionFromRequest>>,
) {
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

  return null;
}

function protectCotizadorApi(
  request: NextRequest,
  session: Awaited<ReturnType<typeof getSessionFromRequest>>,
) {
  if (!session || !canReadStock(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const isWriteMethod =
    request.method === "POST" ||
    request.method === "PATCH" ||
    request.method === "PUT" ||
    request.method === "DELETE";

  if (isWriteMethod && !canWriteCotizador(session)) {
    return NextResponse.json({ error: "Permiso denegado" }, { status: 403 });
  }

  return null;
}

function protectEnsambleApi(
  request: NextRequest,
  session: Awaited<ReturnType<typeof getSessionFromRequest>>,
) {
  if (!session || !canReadStock(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const isWriteMethod =
    request.method === "POST" ||
    request.method === "PATCH" ||
    request.method === "PUT" ||
    request.method === "DELETE";

  if (isWriteMethod && !canWriteEnsamble(session)) {
    return NextResponse.json({ error: "Permiso denegado" }, { status: 403 });
  }

  return null;
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

  if (pathname.startsWith("/admin-fer")) {
    return protectAdminArea(request, session);
  }

  if (pathname.startsWith("/admin")) {
    return protectAdminArea(request, session);
  }

  if (
    pathname.startsWith("/api/materials") ||
    pathname.startsWith("/api/fer/materials")
  ) {
    const denied = protectMaterialsApi(request, session);
    if (denied) return denied;
  }

  if (
    pathname.startsWith("/api/cotizador") ||
    pathname.startsWith("/api/fer/cotizador")
  ) {
    const denied = protectCotizadorApi(request, session);
    if (denied) return denied;
  }

  if (
    pathname.startsWith("/api/ensamble") ||
    pathname.startsWith("/api/fer/ensamble")
  ) {
    const denied = protectEnsambleApi(request, session);
    if (denied) return denied;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/admin-fer/:path*",
    "/login",
    "/api/materials/:path*",
    "/api/cotizador/:path*",
    "/api/ensamble/:path*",
    "/api/fer/materials/:path*",
    "/api/fer/cotizador/:path*",
    "/api/fer/ensamble/:path*",
  ],
};
