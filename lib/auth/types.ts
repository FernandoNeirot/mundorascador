export type UserRole = "superadmin" | "admin" | "readonly";

export type SessionUser = {
  username: string;
  role: UserRole;
};

export type SessionPayload = SessionUser & {
  exp: number;
};
