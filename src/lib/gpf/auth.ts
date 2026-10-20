import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";

/**
 * Accès au CRM GPF : un mot de passe partagé pour l'instant (usage interne,
 * une seule personne — voir docs/gpf-crm/README.md). Le cookie ne stocke
 * jamais le mot de passe, seulement une empreinte signée pour éviter de le
 * renvoyer en clair à chaque requête.
 */
const COOKIE_NAME = "gpf_session";

const getSecret = () => (process.env.GPF_ACCESS_PASSWORD ?? "").trim();

const sign = (value: string, secret: string) => crypto.createHmac("sha256", secret).update(value).digest("hex");

export const isGpfConfigured = () => Boolean(getSecret());

export const checkGpfPassword = (candidate: string) => {
  const secret = getSecret();
  if (!secret) return false;
  const a = Buffer.from(candidate.trim());
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export const gpfSessionCookieValue = () => {
  const secret = getSecret();
  return sign("gpf-authenticated", secret);
};

export const GPF_COOKIE_NAME = COOKIE_NAME;

export const hasValidGpfSession = async () => {
  const secret = getSecret();
  if (!secret) return false;
  const jar = await cookies();
  const value = jar.get(COOKIE_NAME)?.value;
  return Boolean(value) && value === gpfSessionCookieValue();
};
