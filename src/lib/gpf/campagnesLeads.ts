import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { ingererLead } from "@/lib/gpf/leads";
import { getWebinarParticipantsFromSheet } from "@/lib/googleSheetsWebinar";
import { getWebinarPerParticipants } from "@/lib/webinarPerSheet";
import { WEBINAR_PER_SESSIONS } from "@/lib/webinarPerConfig";

/**
 * Suivi des leads par campagne (webinaires), pour les statistiques : chaque inscrit devient un contact
 * du CRM rattaché à sa campagne (table gpf_campagne_leads, migration 015), sans tâche, notification ni
 * dossier, puis passe à la main en « prise de RDV » ou « devenu client » avec le CA généré.
 */
export const CAMPAGNES_LEADS = [
  { id: "webinaire-per-avocats-2026-09-17", libelle: "Webinaire PER avocats · 17 sept. 2026", source: "Webinaire PER avocats 17 septembre 2026" },
  { id: "webinaire-per-2026-10-11", libelle: "Webinaire PER · 11 oct. 2026", source: "Webinaire PER 11 octobre 2026" },
  { id: "webinaire-per-2026-11-01", libelle: "Webinaire PER · 1er nov. 2026", source: "Webinaire PER 1er novembre 2026" },
  { id: "webinaire-per-2026-11-08", libelle: "Webinaire PER · 8 nov. 2026", source: "Webinaire PER 8 novembre 2026" }
] as const;
export type CampagneLeadId = (typeof CAMPAGNES_LEADS)[number]["id"];

export const ETAPES_CAMPAGNE = ["inscrit", "rdv", "client"] as const;
export type EtapeCampagne = (typeof ETAPES_CAMPAGNE)[number];

export type InscriptionWebinaire = {
  campagne: CampagneLeadId;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string | null;
  /** Colonne « Source » du Google Sheet (« webinaire-per|utm_source:meta|… »). */
  sourceBrute?: string | null;
  inscritAt?: string | null;
  details?: string | null;
};

/** Canal d'acquisition lu dans la source brute (utm_source), « direct » sinon. */
export const canalDe = (sourceBrute: string | null | undefined) =>
  /utm_source[:=]([^|&\s]+)/i.exec(sourceBrute ?? "")?.[1]?.toLowerCase() ?? "direct";

const dateIso = (v: string | null | undefined) => {
  const t = Date.parse(String(v ?? ""));
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString();
};

/**
 * Crée (ou retrouve) le contact d'un inscrit et le rattache à sa campagne, sans tâche d'appel, notification
 * ni dossier (statistiques uniquement). Idempotent : un inscrit déjà rattaché n'est ni recréé ni dupliqué.
 */
export async function enregistrerInscriptionWebinaire(i: InscriptionWebinaire) {
  const campagne = CAMPAGNES_LEADS.find((c) => c.id === i.campagne)!;
  const email = i.email.trim().toLowerCase();
  const canal = canalDe(i.sourceBrute);
  const lead = await ingererLead(
    {
      source: `${campagne.source} · ${canal}`,
      sourceRef: `${campagne.id}:${email}`,
      prenom: i.prenom,
      nom: i.nom,
      email,
      telephone: i.telephone || null,
      message: [`Inscrit(e) au ${campagne.libelle}.`, i.details, i.sourceBrute ? `Source : ${i.sourceBrute}` : null].filter(Boolean).join(" ")
    },
    { silencieux: true, sansTache: true }
  );
  if (!lead.ok || !lead.client_id) return { ok: false as const, error: lead.error ?? "lead_non_cree" };
  const { error } = await supabaseAdmin
    .from("gpf_campagne_leads")
    .upsert({ campagne: campagne.id, client_id: lead.client_id, email, canal, inscrit_at: dateIso(i.inscritAt) }, { onConflict: "campagne,client_id", ignoreDuplicates: true });
  if (error) return { ok: false as const, error: `rattachement_campagne: ${error.message}` };
  return { ok: true as const, cree: Boolean(lead.cree), client_id: lead.client_id };
}

/** Tous les inscrits des Google Sheets des webinaires, par campagne (lecture seule). */
export async function lireInscritsWebinaires() {
  const inscrits: InscriptionWebinaire[] = [];
  const erreurs: { campagne: string; error: string }[] = [];
  const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

  try {
    const avocats = (await getWebinarParticipantsFromSheet()) ?? [];
    // Ce Sheet contient aussi le journal de la prospection (« tracking ») et les désinscriptions des avocats
    // prospectés (« unsubscribed ») : seules les lignes « registered » sont de vrais inscrits.
    for (const p of avocats) {
      if (String(p.status ?? "").trim().toLowerCase() !== "registered") continue;
      if (!p.email?.includes("@")) continue;
      inscrits.push({
        campagne: "webinaire-per-avocats-2026-09-17",
        prenom: p.prenom,
        nom: p.nom,
        email: p.email,
        telephone: p.telephone,
        sourceBrute: p.source,
        inscritAt: p.created_at,
        details: [p.barreau ? `Barreau : ${p.barreau}.` : null, p.cabinet ? `Cabinet : ${p.cabinet}.` : null].filter(Boolean).join(" ") || null
      });
    }
  } catch (e) {
    erreurs.push({ campagne: "webinaire-per-avocats-2026-09-17", error: message(e) });
  }

  // Sheet du 1er novembre : il contient aussi les inscrits du 11 octobre (avant le début de la campagne du 1er novembre).
  try {
    const debut1Nov = Date.parse(WEBINAR_PER_SESSIONS["2026-11-01"].campaignStart);
    for (const p of await getWebinarPerParticipants(WEBINAR_PER_SESSIONS["2026-11-01"].sheetEnv)) {
      if (!String(p.email).includes("@")) continue;
      const t = Date.parse(String(p.created_at));
      inscrits.push({
        campagne: Number.isFinite(t) && t < debut1Nov ? "webinaire-per-2026-10-11" : "webinaire-per-2026-11-01",
        prenom: String(p.prenom),
        nom: String(p.nom),
        email: String(p.email),
        telephone: String(p.telephone || ""),
        sourceBrute: String(p.source || ""),
        inscritAt: String(p.created_at)
      });
    }
  } catch (e) {
    erreurs.push({ campagne: "webinaire-per-2026-11-01", error: message(e) });
  }

  try {
    for (const p of await getWebinarPerParticipants(WEBINAR_PER_SESSIONS["2026-11-08"].sheetEnv)) {
      if (!String(p.email).includes("@")) continue;
      inscrits.push({
        campagne: "webinaire-per-2026-11-08",
        prenom: String(p.prenom),
        nom: String(p.nom),
        email: String(p.email),
        telephone: String(p.telephone || ""),
        sourceBrute: String(p.source || ""),
        inscritAt: String(p.created_at)
      });
    }
  } catch (e) {
    erreurs.push({ campagne: "webinaire-per-2026-11-08", error: message(e) });
  }

  return { inscrits, erreurs };
}

/** Inscrits pas encore rattachés à leur campagne dans le CRM. */
export async function inscritsARattacher(inscrits: InscriptionWebinaire[]) {
  const { data, error } = await supabaseAdmin.from("gpf_campagne_leads").select("campagne, email");
  if (error) throw new Error(error.message);
  const deja = new Set((data ?? []).map((r) => `${r.campagne}|${String(r.email ?? "").toLowerCase()}`));
  const vus = new Set<string>();
  return inscrits.filter((i) => {
    const cle = `${i.campagne}|${i.email.trim().toLowerCase()}`;
    if (deja.has(cle) || vus.has(cle)) return false;
    vus.add(cle);
    return true;
  });
}
