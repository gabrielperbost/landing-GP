import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";

/**
 * Accès au CRM GPF : un mot de passe partagé pour l'instant (usage interne,
 * une seule personne — voir docs/gpf-crm/README.md), avec un second facteur
 * TOTP optionnel (puis imposé une fois activé). Le cookie ne stocke jamais
 * le mot de passe, seulement une empreinte signée avec un horodatage, pour
 * que l'expiration soit vérifiée côté serveur et pas seulement laissée au
 * navigateur.
 */
const COOKIE_NAME = "gpf_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24h : données clients réelles, pas 90 jours.
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;

const getSecret = () => (process.env.GPF_ACCESS_PASSWORD ?? "").trim();
const getTotpSecret = () => (process.env.GPF_TOTP_SECRET ?? "").trim();
const isTotpRequired = () => (process.env.GPF_TOTP_REQUIRED ?? "").trim() === "true";

const sign = (value: string, secret: string) => crypto.createHmac("sha256", secret).update(value).digest("hex");

export const isGpfConfigured = () => Boolean(getSecret());
export const isTotpConfigured = () => Boolean(getTotpSecret());
export { isTotpRequired };

export const checkGpfPassword = (candidate: string) => {
  const secret = getSecret();
  if (!secret) return false;
  const a = Buffer.from(candidate.trim());
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// --- TOTP (RFC 6238), implémenté directement (HMAC-SHA1 intégré à Node) pour
// éviter une dépendance externe pour une fonction aussi contenue. ---

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function base32Encode(buffer: Buffer): string {
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) out += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  const rem = bits.length % 5;
  if (rem) out += BASE32_ALPHABET[parseInt(bits.slice(bits.length - rem).padEnd(5, "0"), 2)];
  return out;
}

export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

function totpAtCounter(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return String(code % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

/** Vérifie un code TOTP à 6 chiffres, avec une tolérance de ±1 pas (dérive d'horloge). */
export const verifyTotp = (token: string | undefined | null): boolean => {
  const secret = getTotpSecret();
  if (!secret) return false;
  const clean = (token ?? "").trim().replace(/\s+/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  const counter = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);
  for (const delta of [0, -1, 1]) {
    const expected = totpAtCounter(secret, counter + delta);
    const a = Buffer.from(clean);
    const b = Buffer.from(expected);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  }
  return false;
};

// --- Session (cookie signé avec horodatage, expiration vérifiée côté serveur) ---

export const gpfSessionCookieValue = () => {
  const secret = getSecret();
  const issuedAt = Date.now();
  const payload = `gpf-authenticated:${issuedAt}`;
  return `${issuedAt}.${sign(payload, secret)}`;
};

export const GPF_COOKIE_NAME = COOKIE_NAME;
export const GPF_SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_SECONDS;

export const hasValidGpfSession = async () => {
  const secret = getSecret();
  if (!secret) return false;
  const jar = await cookies();
  const value = jar.get(COOKIE_NAME)?.value;
  if (!value) return false;

  const [issuedAtRaw, signature] = value.split(".");
  const issuedAt = Number(issuedAtRaw);
  if (!issuedAtRaw || !signature || Number.isNaN(issuedAt)) return false;

  const expectedSignature = sign(`gpf-authenticated:${issuedAt}`, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  const ageSeconds = (Date.now() - issuedAt) / 1000;
  return ageSeconds >= 0 && ageSeconds <= SESSION_MAX_AGE_SECONDS;
};
