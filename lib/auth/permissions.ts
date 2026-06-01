import type { SessionUser, UserRole } from "./types";

/** Usuarios que solo pueden consultar, sin importar su rol asignado. */
const READONLY_USERNAMES = new Set(["chino"]);

/** Usuarios readonly que pueden crear y editar cotizaciones. */
const COTIZADOR_WRITE_USERNAMES = new Set(["flavio"]);

export const canReadStock = (role: UserRole): boolean =>
  role === "superadmin" || role === "admin" || role === "readonly";

export const canWriteStock = (user: SessionUser): boolean => {
  if (READONLY_USERNAMES.has(user.username.toLowerCase())) {
    return false;
  }
  return user.role === "superadmin" || user.role === "admin";
};

export const canWriteCotizador = (user: SessionUser): boolean => {
  if (canWriteStock(user)) return true;
  return COTIZADOR_WRITE_USERNAMES.has(user.username.toLowerCase());
};
