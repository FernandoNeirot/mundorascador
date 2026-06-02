import type { SessionUser } from "@/lib/auth/types";
import { canWriteCotizador } from "@/lib/auth/permissions";
import type { Cotizacion } from "./types";

export function isCotizacionOwnedBy(
  username: string,
  cotizacion: Pick<Cotizacion, "createdBy">,
): boolean {
  return username.toLowerCase() === cotizacion.createdBy.toLowerCase();
}

export function isCotizacionOwner(
  user: SessionUser,
  cotizacion: Pick<Cotizacion, "createdBy">,
): boolean {
  return isCotizacionOwnedBy(user.username, cotizacion);
}

export function canEditCotizacion(
  user: SessionUser,
  cotizacion: Pick<Cotizacion, "createdBy">,
): boolean {
  if (!canWriteCotizador(user)) return false;
  return isCotizacionOwner(user, cotizacion);
}
