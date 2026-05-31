import bcrypt from "bcryptjs";
import type { SessionUser, UserRole } from "./types";

type AuthUserConfig = {
  username: string;
  passwordHash: string;
  role: UserRole;
};

function cleanEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function decodePasswordHash(value: string): string {
  if (value.startsWith("$2")) return value;
  return Buffer.from(value, "base64").toString("utf8");
}

function readUser(
  usernameKey: string,
  passwordHashKey: string,
  role: UserRole,
): AuthUserConfig | null {
  const username = cleanEnvValue(process.env[usernameKey]);
  const rawHash = cleanEnvValue(process.env[passwordHashKey]);

  if (!username || !rawHash) return null;

  return {
    username,
    passwordHash: decodePasswordHash(rawHash),
    role,
  };
}

export function getConfiguredUsers(): AuthUserConfig[] {
  return [
    readUser(
      "AUTH_SUPERADMIN_USERNAME",
      "AUTH_SUPERADMIN_PASSWORD_HASH",
      "superadmin",
    ),
    readUser("AUTH_ADMIN_USERNAME", "AUTH_ADMIN_PASSWORD_HASH", "admin"),
    readUser(
      "AUTH_READONLY_USERNAME",
      "AUTH_READONLY_PASSWORD_HASH",
      "readonly",
    ),
  ].filter((user): user is AuthUserConfig => user !== null);
}

export async function authenticateUser(
  username: string,
  password: string,
): Promise<SessionUser | null> {
  const normalizedUsername = username.trim().toLowerCase();
  const users = getConfiguredUsers();

  for (const user of users) {
    if (user.username.toLowerCase() !== normalizedUsername) continue;

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) return null;

    return { username: user.username, role: user.role };
  }

  return null;
}
