import type { SessionUser } from "@/lib/auth/types";
import { canWriteEnsamble } from "@/lib/auth/permissions";
import type { Ensamble } from "./types";

export function isEnsambleOwnedBy(
  username: string,
  ensamble: Pick<Ensamble, "createdBy">,
): boolean {
  return username.toLowerCase() === ensamble.createdBy.toLowerCase();
}

export function isEnsambleOwner(
  user: SessionUser,
  ensamble: Pick<Ensamble, "createdBy">,
): boolean {
  return isEnsambleOwnedBy(user.username, ensamble);
}

export function canEditEnsamble(
  user: SessionUser,
  ensamble: Pick<Ensamble, "createdBy">,
): boolean {
  if (!canWriteEnsamble(user)) return false;
  return isEnsambleOwner(user, ensamble);
}
