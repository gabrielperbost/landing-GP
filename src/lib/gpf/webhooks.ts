import "server-only";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";

/** Secret partagé des webhooks GPF (?secret=… ou en-tête x-webhook-secret). */
export function secretValide(request: NextRequest) {
  const attendu = process.env.GPF_WEBHOOK_SECRET?.trim();
  if (!attendu) return false;
  const fourni = request.nextUrl.searchParams.get("secret") || request.headers.get("x-webhook-secret") || "";
  const a = Buffer.from(fourni);
  const b = Buffer.from(attendu);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const egalConstant = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Champs d'un formulaire (Tally, Meta) ramenés à { libellé normalisé : valeur texte }. */
export function champsFormulaire(liste: { label?: string; key?: string; name?: string; value?: unknown; values?: unknown[]; options?: { id: string; text: string }[] }[]) {
  const out: Record<string, string> = {};
  for (const f of liste ?? []) {
    const label = norm(String(f.label ?? f.name ?? f.key ?? ""));
    let v: unknown = f.value ?? f.values;
    if (Array.isArray(v)) v = v.map((x) => f.options?.find((o) => o.id === x)?.text ?? x).join(", ");
    if (v != null && v !== "") out[label] = String(v).trim();
  }
  return out;
}

/** Trouve la première valeur dont le libellé correspond à l'un des motifs. */
export const trouver = (champs: Record<string, string>, motifs: RegExp[]) => {
  for (const m of motifs) for (const [k, v] of Object.entries(champs)) if (m.test(k)) return v;
  return null;
};

export const MOTIFS = {
  prenom: [/^prenom/, /first.?name/, /(^|\s)prenom/],
  nom: [/^nom$/, /^nom de famille/, /last.?name/, /(^|\s)nom($|\s)/],
  complet: [/full.?name/, /nom complet/, /prenom.*nom/, /nom.*prenom/],
  email: [/e-?mail/, /courriel/],
  telephone: [/phone/, /telephone/, /portable/, /mobile/, /(^|\s)tel/],
  codePostal: [/code.?postal/, /zip/, /post.?code/],
  ville: [/ville/, /city/],
  produit: [/produit/, /besoin/, /projet/, /assurance/, /offre/],
  message: [/message/, /commentaire/, /precision/, /question/]
};
