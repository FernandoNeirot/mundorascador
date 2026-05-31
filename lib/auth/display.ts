const USERNAME_DISPLAY: Record<string, string> = {
  chino: "usuario0",
  flavio: "usuario1",
};

export function getDisplayUsername(username: string): string {
  return USERNAME_DISPLAY[username.toLowerCase()] ?? username;
}
