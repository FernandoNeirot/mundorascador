import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Uso: node scripts/generate-auth-hash.mjs <contraseña>");
  console.error("Genera el hash en base64 para AUTH_*_PASSWORD_HASH en .env");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const encoded = Buffer.from(hash, "utf8").toString("base64");

console.log(encoded);
