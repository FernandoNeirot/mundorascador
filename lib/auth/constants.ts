import type { UserRole } from "./types";

export const SESSION_COOKIE = "taller-session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  readonly: "Solo lectura",
};
