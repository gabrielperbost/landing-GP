import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { createContact, findDuplicate } from "@/lib/gpf/contacts";
import { notify } from "@/lib/gpf/notify";
import { addHours, createTask } from "@/lib/gpf/tasks";
import { GPF_PRODUITS, type GpfProduit, type GpfScore } from "@/lib/gpf/types";

export type LeadEntrant = {
  source: "Meta Ads" | "Tally" | "Calendly" | "Masterleads" | "Site" | string;
  sourceRef?: string | null;
  prenom?: string | null;
  nom?: string | null;
  email?: string | null;
  telephone?: string | null;
  code_postal?: string | null;
  ville?: string | null;
  produit?: string | null;
  message?: string | null;
};

const SANTE = /(sant[ée]|m[ée]dical|maladie|traitement|fumeur|tabac|pathologi|ant[ée]c[ée]dent)/i;

/** Devine le produit à partir d'un libellé de formulaire ou de campagne. */
export function devinerProduit(texte: string | null | undefined): GpfProduit | null {
  const t = (texte ?? "").toLowerCase();
  if (/(emprunt|pr[eê]t|lemoine|cr[eé]dit immo)/.test(t)) return "assurance_emprunteur";
  if (/\bper\b|retraite/.test(t)) return "per";
  if (/mutuelle|compl[eé]mentaire sant/.test(t)) return "mutuelle";
  if (/pr[eé]voyance|arr[eê]t de travail/.test(t)) return "prevoyance";
  if (/regroupement|rachat de cr[eé]dit/.test(t)) return "regroupement_credits";
  if (/assurance.?vie/.test(t)) return "assurance_vie";
  return null;
}

/** Sépare « Prénom Nom » quand le formulaire ne donne qu'un nom complet. */
export function separerNom(complet: string) {
  const parts = complet.trim().split(/\s+/);
  if (parts.length < 2) return { prenom: parts[0] ?? "", nom: "" };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}

/**
 * Réception d'un lead : dédoublonnage (e-mail / téléphone), création du
 * contact et du dossier, tâche « Appeler dans l'heure », notification, score
 * chaud. Un lead déjà connu reçoit une note et une nouvelle tâche d'appel.
 * Idempotent par (source, sourceRef).
 */
export async function ingererLead(l: LeadEntrant, opts: { silencieux?: boolean } = {}): Promise<{ ok: boolean; client_id?: string; cree?: boolean; doublon?: boolean; error?: string }> {
  if (l.sourceRef) {
    const { data: deja } = await supabaseAdmin.from("gpf_lead_events").select("client_id").eq("source", l.source).eq("source_ref", l.sourceRef).limit(1);
    if (deja?.length) return { ok: true, client_id: deja[0].client_id ?? undefined, cree: false, doublon: true };
  }
  let prenom = (l.prenom ?? "").trim();
  let nom = (l.nom ?? "").trim();
  if (!nom && prenom.includes(" ")) ({ prenom, nom } = separerNom(prenom));
  if (!prenom && !nom && !l.email && !l.telephone) return { ok: false, error: "lead_vide" };
  if (!prenom) prenom = l.email?.split("@")[0] ?? "Lead";
  if (!nom) nom = "(à compléter)";
  const produit = l.produit && (GPF_PRODUITS as readonly string[]).includes(l.produit) ? (l.produit as GpfProduit) : devinerProduit(l.produit);
  const message = l.message && !SANTE.test(l.message) ? l.message.slice(0, 1000) : null;

  const existant = await findDuplicate(l.email, l.telephone);
  let clientId: string;
  let cree = false;
  if (existant) {
    clientId = existant.id;
    await supabaseAdmin.from("gpf_notes").insert({ client_id: clientId, categorie: "suivi", contenu: `Nouvelle demande reçue via ${l.source}${produit ? ` (${produit.replace(/_/g, " ")})` : ""}.${message ? ` Message : ${message}` : ""}` });
    await createTask({ client_id: clientId, titre: `Rappeler ${existant.prenom} ${existant.nom} (nouvelle demande ${l.source})`, categorie: "appel", echeance: addHours(new Date(), 1), auto: true, origine: "nouveau_lead" });
    if (!opts.silencieux) await notify("nouveau_lead", `Lead déjà connu : ${existant.prenom} ${existant.nom}`, `Nouvelle demande via ${l.source}`, `/gpf/contacts/${clientId}`);
  } else {
    const r = await createContact(
      { prenom, nom, email: l.email?.toLowerCase() ?? null, telephone: l.telephone ?? null, code_postal: l.code_postal ?? null, ville: l.ville ?? null, provenance: l.source, score: "chaud", notes: message },
      { lead: true, forcer: true, origine: l.source, silencieux: opts.silencieux }
    );
    if (!r.ok) return { ok: false, error: r.error };
    clientId = r.client.id;
    cree = true;
  }

  if (produit) {
    const { data: ouverts } = await supabaseAdmin.from("gpf_dossiers").select("id").eq("client_id", clientId).eq("produit", produit).not("statut", "in", "(refuse,sans_suite,effectif)").is("deleted_at", null).limit(1);
    if (!ouverts?.length) await supabaseAdmin.from("gpf_dossiers").insert({ client_id: clientId, produit, statut: "a_traiter", source: l.source });
  }
  await supabaseAdmin.from("gpf_lead_events").insert({ source: l.source, source_ref: l.sourceRef ?? null, client_id: clientId, cree, resume: [prenom, nom, produit].filter(Boolean).join(" · ") });
  return { ok: true, client_id: clientId, cree };
}

/**
 * Score automatique d'un lead : chaud (arrivé il y a moins de 48 h, ou RDV à
 * venir, ou devis en cours), froid (plus de 30 jours sans contact ou 3 NRP et
 * plus), tiède sinon.
 */
export function scoreAuto(c: { created_at: string; dernier_contact_at?: string | null; nrp_count?: number | null }, opts: { rdvAVenir: boolean; devisEnCours: boolean }): GpfScore {
  const age = Date.now() - new Date(c.created_at).getTime();
  const depuisContact = c.dernier_contact_at ? Date.now() - new Date(c.dernier_contact_at).getTime() : age;
  if (opts.rdvAVenir || opts.devisEnCours || age < 48 * 3600_000) return "chaud";
  if ((c.nrp_count ?? 0) >= 3 || depuisContact > 30 * 86400_000) return "froid";
  return "tiede";
}

/** Remplace {prenom}, {nom} dans un modèle d'e-mail et ajoute le lien de désabonnement. */
export function personnaliser(modele: string, c: { prenom: string; nom: string; desabo_token?: string | null }, baseUrl: string) {
  const texte = modele.replace(/\{prenom\}/gi, c.prenom).replace(/\{nom\}/gi, c.nom);
  const lien = c.desabo_token ? `${baseUrl}/api/gpf/public/desabonnement?t=${c.desabo_token}` : null;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#1f2430">${texte
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`)
    .join("")}${lien ? `<p style="font-size:12px;color:#8a8f98;margin-top:28px">Vous ne souhaitez plus recevoir nos e-mails ? <a href="${lien}" style="color:#8a8f98">Se désabonner</a>.</p>` : ""}</div>`;
  return { texte: lien ? `${texte}\n\n—\nSe désabonner : ${lien}` : texte, html };
}

export const baseUrl = () => (process.env.NEXT_PUBLIC_BASE_URL || "https://gp-finances.fr").replace(/\/+$/, "");
