import type { UserRole } from "./types";

export const canReadStock = (role: UserRole): boolean =>
  role === "superadmin" || role === "admin" || role === "readonly";

export const canWriteStock = (role: UserRole): boolean =>
  role === "superadmin" || role === "admin";
