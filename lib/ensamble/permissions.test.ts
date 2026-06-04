import { describe, expect, it, vi } from "vitest";
import type { SessionUser } from "@/lib/auth/types";
import type { Ensamble } from "./types";

vi.mock("@/lib/auth/permissions", () => ({
  canWriteEnsamble: (user: SessionUser) =>
    user.role === "superadmin" ||
    user.role === "admin" ||
    user.username.toLowerCase() === "chino" ||
    user.username.toLowerCase() === "flavio",
}));

import { canEditEnsamble, isEnsambleOwnedBy } from "./permissions";

const owner: SessionUser = {
  username: "chino",
  role: "admin",
};

const otherLimited: SessionUser = {
  username: "flavio",
  role: "readonly",
};

const superadmin: SessionUser = {
  username: "admin",
  role: "superadmin",
};

const ensamble: Pick<Ensamble, "createdBy"> = { createdBy: "chino" };

describe("ensamble permissions", () => {
  it("detects ownership case-insensitively", () => {
    expect(isEnsambleOwnedBy("Chino", ensamble)).toBe(true);
    expect(isEnsambleOwnedBy("flavio", ensamble)).toBe(false);
  });

  it("allows edit only for owner with write access", () => {
    expect(canEditEnsamble(owner, ensamble)).toBe(true);
    expect(canEditEnsamble(otherLimited, ensamble)).toBe(false);
    expect(canEditEnsamble(superadmin, ensamble)).toBe(false);
  });
});
