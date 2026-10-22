import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { sendGpfMail } from "@/lib/gpf/mailer";
import { baseUrl, personnaliser, scoreAuto } from "@/lib/gpf/leads";
import { GPF_STATUTS_SIGNES } from "@/lib/gpf/types";

/** Envoie au plus `max` e-mails en attente d'une campagne (SMTP du cabinet, sans service payant). */
export async function envoyerLot(campagneId: string, max = 25) {
  const { data: c } = await supabaseAdmin.from("gpf_campagnes").select("*").eq("id", campagneId).single();
  if (!c || c.statut !== "en_cours") return { envoyes: 0, restants: 0 };
  const { data: lot } = await supabaseAdmin.from("gpf_campagne_envois").select("id, client_id, email").eq("campagne_id", campagneId).eq("statut", "a_envoyer").limit(max);
  const ids = (lot ?? []).map((e) => e.client_id);
  const { data: clients } = ids.length ? await supabaseAdmin.from("gpf_clients").select("id, prenom, nom, desabo_token, desabonne_at").in("id", ids) : { data: [] };
  const par = new Map((clients ?? []).map((x) => [x.id, x]));
  let envoyes = 0;
  let erreurs = 0;
  for (const e of lot ?? []) {
    const cl = par.get(e.client_id);
    if (!cl || cl.desabonne_at) {
      await supabaseAdmin.from("gpf_campagne_envois").update({ statut: "erreur", erreur: "désabonné" }).eq("id", e.id);
      erreurs++;
      continue;
    }
    const { texte, html } = personnaliser(c.corps, cl, baseUrl());
    try {
      await sendGpfMail({ to: e.email, subject: personnaliser(c.sujet, cl, baseUrl()).texte.split("\n")[0], text: texte, html });
      await supabaseAdmin.from("gpf_campagne_envois").update({ statut: "envoye", envoye_at: new Date().toISOString() }).eq("id", e.id);
      envoyes++;
    } catch (err) {
      await supabaseAdmin.from("gpf_campagne_envois").update({ statut: "erreur", erreur: err instanceof Error ? err.message.slice(0, 200) : "erreur" }).eq("id", e.id);
      erreurs++;
    }
  }
  const { count: restants } = await supabaseAdmin.from("gpf_campagne_envois").select("id", { count: "exact", head: true }).eq("campagne_id", campagneId).eq("statut", "a_envoyer");
  await supabaseAdmin
    .from("gpf_campagnes")
    .update({ nb_envoyes: (c.nb_envoyes ?? 0) + envoyes, nb_erreurs: (c.nb_erreurs ?? 0) + erreurs, ...(restants ? {} : { statut: "envoyee", terminee_at: new Date().toISOString() }) })
    .eq("id", campagneId);
  return { envoyes, erreurs, restants: restants ?? 0 };
}

type Etape = { jour: number; sujet: string; corps: string };

/**
 * Séquences automatiques (passage quotidien). Seuls les contacts arrivés
 * après l'activation de la séquence la reçoivent ; elle s'arrête dès qu'un
 * appel a abouti, qu'un RDV est pris ou que l'affaire avance.
 */
export async function executerSequences() {
  const { data: sequences, error } = await supabaseAdmin.from("gpf_sequences").select("*").eq("actif", true);
  if (error || !sequences?.length) return { envoyes: 0 };
  const [{ data: clients }, { data: dossiers }, { data: appels }, { data: rdv }, { data: envois }, { data: historique }] = await Promise.all([
    supabaseAdmin.from("gpf_clients").select("id, prenom, nom, email, created_at, desabonne_at, desabo_token").is("deleted_at", null).not("email", "is", null),
    supabaseAdmin.from("gpf_dossiers").select("id, client_id, statut, contrat_statut").is("deleted_at", null),
    supabaseAdmin.from("gpf_calls").select("client_id, resultat, created_at"),
    supabaseAdmin.from("gpf_appointments").select("client_id, statut"),
    supabaseAdmin.from("gpf_sequence_envois").select("sequence_id, client_id, etape"),
    supabaseAdmin.from("gpf_status_history").select("dossier_id, nouveau_statut, changed_at").eq("nouveau_statut", "devis_envoye")
  ]);
  const deja = new Set((envois ?? []).map((e) => `${e.sequence_id}|${e.client_id}|${e.etape}`));
  const joint = new Set((appels ?? []).filter((a) => a.resultat === "joint").map((a) => a.client_id));
  const avecRdv = new Set((rdv ?? []).filter((r) => r.statut !== "annule").map((r) => r.client_id));
  const dossiersPar = new Map<string, { id: string; statut: string; contrat_statut: string | null }[]>();
  for (const d of dossiers ?? []) dossiersPar.set(d.client_id, [...(dossiersPar.get(d.client_id) ?? []), d]);
  const premierNrp = new Map<string, string>();
  for (const a of (appels ?? []).filter((x) => x.resultat === "nrp").sort((x, y) => x.created_at.localeCompare(y.created_at))) if (!premierNrp.has(a.client_id)) premierNrp.set(a.client_id, a.created_at);
  const devisLe = new Map((historique ?? []).map((h) => [h.dossier_id, h.changed_at]));
  let envoyes = 0;

  for (const s of sequences) {
    const etapes = ((s.etapes ?? []) as Etape[]).filter((e) => e.sujet && e.corps).sort((a, b) => a.jour - b.jour);
    for (const c of clients ?? []) {
      if (c.desabonne_at) continue;
      const ds = dossiersPar.get(c.id) ?? [];
      if (ds.some((d) => d.contrat_statut || GPF_STATUTS_SIGNES.has(d.statut))) continue;
      let depart: string | null = null;
      if (s.declencheur === "nouveau_lead") {
        if (joint.has(c.id) || avecRdv.has(c.id) || ds.some((d) => !["a_traiter", "nrp"].includes(d.statut))) continue;
        depart = c.created_at;
      } else if (s.declencheur === "nrp") {
        if (joint.has(c.id) || avecRdv.has(c.id)) continue;
        depart = premierNrp.get(c.id) ?? null;
      } else {
        const d = ds.find((x) => x.statut === "devis_envoye");
        depart = d ? devisLe.get(d.id) ?? null : null;
      }
      if (!depart || depart < s.created_at) continue;
      const jours = Math.floor((Date.now() - new Date(depart).getTime()) / 86400000);
      // Une seule étape par passage : la plus récente due et non envoyée.
      const due = etapes.map((e, i) => ({ e, i })).filter(({ e, i }) => e.jour <= jours && !deja.has(`${s.id}|${c.id}|${i}`)).pop();
      if (!due) continue;
      const { texte, html } = personnaliser(due.e.corps, c, baseUrl());
      try {
        await sendGpfMail({ to: c.email!, subject: personnaliser(due.e.sujet, c, baseUrl()).texte.split("\n")[0], text: texte, html });
        await supabaseAdmin.from("gpf_sequence_envois").insert({ sequence_id: s.id, client_id: c.id, etape: due.i });
        envoyes++;
      } catch (err) {
        await supabaseAdmin.from("gpf_sequence_envois").insert({ sequence_id: s.id, client_id: c.id, etape: due.i, statut: "erreur", erreur: err instanceof Error ? err.message.slice(0, 200) : "erreur" });
      }
    }
  }
  return { envoyes };
}

/** Score automatique des leads (hors score fixé à la main), recalculé chaque jour. */
export async function recalculerScores() {
  const [{ data: clients, error }, { data: dossiers }, { data: rdv }] = await Promise.all([
    supabaseAdmin.from("gpf_clients").select("id, created_at, dernier_contact_at, nrp_count, score, score_manuel").is("deleted_at", null).eq("score_manuel", false),
    supabaseAdmin.from("gpf_dossiers").select("client_id, statut, contrat_statut").is("deleted_at", null),
    supabaseAdmin.from("gpf_appointments").select("client_id, debut, statut").gte("debut", new Date().toISOString())
  ]);
  if (error) return { maj: 0 };
  const signes = new Set((dossiers ?? []).filter((d) => d.contrat_statut || GPF_STATUTS_SIGNES.has(d.statut)).map((d) => d.client_id));
  const devis = new Set((dossiers ?? []).filter((d) => ["devis_envoye", "en_cours_souscription"].includes(d.statut)).map((d) => d.client_id));
  const rdvs = new Set((rdv ?? []).filter((r) => r.statut !== "annule").map((r) => r.client_id));
  const groupes: Record<string, string[]> = { chaud: [], tiede: [], froid: [] };
  for (const c of clients ?? []) {
    if (signes.has(c.id)) continue;
    const s = scoreAuto(c, { rdvAVenir: rdvs.has(c.id), devisEnCours: devis.has(c.id) });
    if (s !== c.score) groupes[s].push(c.id);
  }
  let maj = 0;
  for (const [score, ids] of Object.entries(groupes)) {
    for (let i = 0; i < ids.length; i += 200) {
      await supabaseAdmin.from("gpf_clients").update({ score }).in("id", ids.slice(i, i + 200));
      maj += ids.slice(i, i + 200).length;
    }
  }
  return { maj };
}
