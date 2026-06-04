import type { SessionUser, UserRole } from "./types";

/**
 * Stock solo lectura (aunque tengan rol admin) y cotizador con alta/edición
 * de sus propias cotizaciones.
 */
const LIMITED_INVENTORY_USERNAMES = new Set(["chino", "flavio"]);

export const canReadStock = (role: UserRole): boolean =>
  role === "superadmin" || role === "admin" || role === "readonly";

export const canWriteStock = (user: SessionUser): boolean => {
  if (LIMITED_INVENTORY_USERNAMES.has(user.username.toLowerCase())) {
    return false;
  }
  return user.role === "superadmin" || user.role === "admin";
};

export const canWriteCotizador = (user: SessionUser): boolean => {
  if (canWriteStock(user)) return true;
  return LIMITED_INVENTORY_USERNAMES.has(user.username.toLowerCase());
};

/** Misma política que cotizador: crear y editar ensambles propios. */
export const canWriteEnsamble = canWriteCotizador;
