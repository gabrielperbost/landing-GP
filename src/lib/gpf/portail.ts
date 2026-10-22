import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { sendGpfMail } from "@/lib/gpf/mailer";
import { baseUrl } from "@/lib/gpf/leads";
import { CABINET } from "@/lib/gpf/cabinet";

// ---------------------------------------------------------------------------
// Espace client GPF : lien magique à usage unique (7 jours), puis session
// signée de 7 jours dans un cookie httpOnly. Le client ne voit que ses
// contrats, les documents partagés et les pièces demandées : jamais les
// notes, ni les commissions.
// ---------------------------------------------------------------------------

export const COOKIE = "gpf_portail";
const DUREE_LIEN_H = 24 * 7;
const DUREE_SESSION_S = 7 * 24 * 3600;

const secret = () => {
  const s = process.env.GPF_PORTAL_SECRET?.trim();
  if (!s) throw new Error("portail_non_configure");
  return s;
};
const hmac = (v: string) => crypto.createHmac("sha256", secret()).update(v).digest("base64url");
export const empreinte = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

/** Crée un lien d'accès et l'envoie par e-mail au client. */
export async function envoyerLienPortail(clientId: string) {
  const { data: c } = await supabaseAdmin.from("gpf_clients").select("id, prenom, nom, email").eq("id", clientId).is("deleted_at", null).single();
  if (!c?.email) return { ok: false as const, error: "email_manquant" };
  const token = crypto.randomBytes(32).toString("base64url");
  const { error } = await supabaseAdmin
    .from("gpf_portal_tokens")
    .insert({ client_id: c.id, token_hash: empreinte(token), expires_at: new Date(Date.now() + DUREE_LIEN_H * 3600_000).toISOString() });
  if (error) return { ok: false as const, error: error.message };
  const lien = `${baseUrl()}/mon-espace/acces?t=${token}`;
  await sendGpfMail({
    to: c.email,
    subject: "Votre espace client GP Finances",
    text: `Bonjour ${c.prenom},\n\nVoici votre lien personnel pour accéder à votre espace client (contrats, documents, pièces à transmettre) :\n${lien}\n\nCe lien est valable 7 jours et ne peut servir qu'une fois. Ne le transférez pas.\n\nGabriel – ${CABINET.nom}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#1f2430"><p>Bonjour ${c.prenom.replace(/</g, "")},</p><p>Voici votre lien personnel pour accéder à votre espace client : contrats, documents et pièces à transmettre.</p><p><a href="${lien}" style="display:inline-block;background:#071C2C;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px">Accéder à mon espace</a></p><p style="font-size:13px;color:#6b7280">Ce lien est valable 7 jours et ne peut servir qu'une fois. Ne le transférez pas.</p><p>Gabriel – ${CABINET.nom}</p></div>`
  });
  return { ok: true as const, email: c.email };
}

/** Consomme un lien : renvoie l'id client si le jeton est valide, inutilisé et non expiré. */
export async function consommerLien(token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{30,}$/.test(token)) return null;
  const { data } = await supabaseAdmin
    .from("gpf_portal_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token_hash", empreinte(token))
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("client_id")
    .single();
  return data?.client_id ?? null;
}

export function valeurCookie(clientId: string) {
  const exp = Math.floor(Date.now() / 1000) + DUREE_SESSION_S;
  return { valeur: `${clientId}.${exp}.${hmac(`${clientId}.${exp}`)}`, maxAge: DUREE_SESSION_S };
}

/** Client connecté à l'espace (ou null). */
export async function clientPortail(): Promise<string | null> {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return null;
  const [id, exp, sig] = v.split(".");
  if (!id || !exp || !sig || Number(exp) < Date.now() / 1000) return null;
  try {
    const attendu = hmac(`${id}.${exp}`);
    if (attendu.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(attendu), Buffer.from(sig))) return null;
  } catch {
    return null;
  }
  return id;
}

// Limitation simple des demandes de lien (mémoire de l'instance).
const tentatives = new Map<string, number[]>();
export function limiter(cle: string, max = 5, fenetreMs = 15 * 60_000) {
  const now = Date.now();
  const l = (tentatives.get(cle) ?? []).filter((t) => now - t < fenetreMs);
  l.push(now);
  tentatives.set(cle, l);
  return l.length <= max;
}
