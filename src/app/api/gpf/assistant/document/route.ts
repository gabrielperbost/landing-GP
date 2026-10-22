import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { appelClaude, extraireJson, iaDisponible, MODELE_ECONOMIQUE } from "@/lib/gpf/anthropic";
import { construireProposition, sansSante, type Proposition } from "@/lib/gpf/assistant";
import { formatNom } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const AUDIO = /\.(mp3|m4a|wav|aac|ogg|mp4|webm)$/i;

const CONSIGNES: Record<string, string> = {
  offre_pret:
    'Document : offre de prêt immobilier. Extrais uniquement {"banque": "nom", "montant_pret": nombre, "taux": nombre en % (ex. 3.45), "duree_mois": nombre, "date_offre_pret": "AAAA-MM-JJ", "cout_assurance_banque": coût total de l\'assurance proposée par la banque sur toute la durée (nombre) ou null}. Ignore toute information médicale. Réponds par le seul objet JSON.',
  avis_imposition:
    'Document : avis d\'impôt sur le revenu. Extrais uniquement {"annee": année des revenus (nombre), "revenu_fiscal_reference": nombre, "impot_paye": impôt net à payer (nombre), "nb_parts": nombre, "tmi": tranche marginale estimée en % parmi 0, 11, 30, 41, 45}. N\'extrais ni numéro fiscal ni adresse. Réponds par le seul objet JSON.'
};

/**
 * Lecture d'un document par l'IA pour préremplir la fiche : offre de prêt
 * (onglet Projet), avis d'imposition (onglet Fiscalité), ou transcription d'un
 * rendez-vous Zoom (compte rendu, prochaines étapes). Tout revient sous forme
 * de propositions à valider ; rien n'est enregistré automatiquement, et le
 * fichier n'est pas conservé.
 */
export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!iaDisponible()) return NextResponse.json({ ok: false, error: "assistant_non_configure" });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const type = String(form?.get("type") ?? "");
  const clientId = String(form?.get("client_id") ?? "");
  let dossierId = (form?.get("dossier_id") as string) || null;
  if (!file || !(file instanceof File) || !clientId) return NextResponse.json({ ok: false, error: "parametres_requis" }, { status: 400 });
  if (AUDIO.test(file.name)) return NextResponse.json({ ok: false, error: "audio_non_pris_en_charge" }, { status: 400 });
  if (file.size > 15 * 1024 * 1024) return NextResponse.json({ ok: false, error: "fichier_trop_gros" }, { status: 400 });

  const { data: client } = await supabaseAdmin.from("gpf_clients").select("id, prenom, nom").eq("id", clientId).single();
  if (!client) return NextResponse.json({ ok: false, error: "client_introuvable" }, { status: 404 });

  try {
    if (type === "transcription") {
      const texte = Buffer.from(await file.arrayBuffer()).toString("utf8").slice(0, 120000);
      const r = await appelClaude({
        model: MODELE_ECONOMIQUE,
        maxTokens: 2000,
        system:
          "Tu analyses la transcription d'un rendez-vous entre un courtier en assurance et son client. Tu écris en français. Tu n'inclus AUCUNE information de santé (pathologie, traitement, antécédents, tabac…), même si elle est évoquée.",
        messages: [
          {
            role: "user",
            content: `Transcription du rendez-vous avec ${formatNom(client)} :\n\n${texte}\n\nRéponds par un objet JSON : {"compte_rendu": "5 à 10 lignes : besoins, situation, solutions évoquées, objections", "prochaines_etapes": ["…"], "prochaine_action": "action courte", "prochaine_action_date": "AAAA-MM-JJ ou null", "fiche": {champs déduits avec certitude parmi profession, situation_familiale, nb_enfants, "budget.revenus_annuels", "budget.patrimoine", "fiscalite.tmi"}}`
          }
        ]
      });
      const j = extraireJson<{ compte_rendu?: string; prochaines_etapes?: string[]; prochaine_action?: string; prochaine_action_date?: string | null; fiche?: Record<string, unknown> }>(
        r.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("\n")
      );
      if (!j) return NextResponse.json({ ok: false, error: "lecture_impossible" }, { status: 422 });
      const compteRendu = sansSante(`${j.compte_rendu ?? ""}${j.prochaines_etapes?.length ? `\nProchaines étapes : ${j.prochaines_etapes.join(" ; ")}` : ""}`);
      const propositions: Proposition[] = [];
      const note = await construireProposition({ cible: "note", client_id: clientId, titre: "Compte rendu du rendez-vous", description: "Ajouté aux notes de la fiche (catégorie Réunion).", champs: { contenu: compteRendu, categorie: "reunion" } });
      if (!("erreur" in note)) propositions.push(note);
      const fiche = await construireProposition({
        cible: "client",
        id: clientId,
        titre: "Informations déduites du rendez-vous",
        description: "Cochez seulement ce qui est exact.",
        champs: { ...(j.fiche ?? {}), prochaine_action: j.prochaine_action, prochaine_action_date: j.prochaine_action_date }
      });
      if (!("erreur" in fiche)) propositions.push(fiche);
      return NextResponse.json({ ok: true, reponse: compteRendu, propositions });
    }

    if (!(type in CONSIGNES)) return NextResponse.json({ ok: false, error: "type_invalide" }, { status: 400 });
    if (!/\.pdf$/i.test(file.name) && !/^image\//.test(file.type)) return NextResponse.json({ ok: false, error: "format_pdf_ou_image" }, { status: 400 });
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    const bloc = /\.pdf$/i.test(file.name)
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : { type: "image", source: { type: "base64", media_type: file.type, data } };
    const r = await appelClaude({ model: MODELE_ECONOMIQUE, maxTokens: 600, messages: [{ role: "user", content: [bloc, { type: "text", text: CONSIGNES[type] }] }] });
    const j = extraireJson<Record<string, unknown>>(r.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("\n"));
    if (!j) return NextResponse.json({ ok: false, error: "lecture_impossible" }, { status: 422 });

    let p: Proposition | { erreur: string };
    if (type === "offre_pret") {
      if (!dossierId) {
        const { data: ds } = await supabaseAdmin.from("gpf_dossiers").select("id, statut").eq("client_id", clientId).eq("produit", "assurance_emprunteur").is("deleted_at", null).order("created_at", { ascending: false });
        dossierId = (ds ?? []).find((d) => d.statut !== "refuse" && d.statut !== "sans_suite")?.id ?? ds?.[0]?.id ?? null;
      }
      if (!dossierId) return NextResponse.json({ ok: false, error: "aucun_dossier_emprunteur" }, { status: 400 });
      p = await construireProposition({ cible: "dossier", id: dossierId, titre: "Projet lu sur l'offre de prêt", description: "Valeurs extraites de l'offre : vérifiez avant de valider.", champs: j });
    } else {
      const champs = Object.fromEntries(Object.entries(j).map(([k, v]) => [`fiscalite.${k}`, v]));
      p = await construireProposition({ cible: "client", id: clientId, titre: "Fiscalité lue sur l'avis d'imposition", description: "Valeurs extraites de l'avis : vérifiez avant de valider.", champs });
    }
    if ("erreur" in p) return NextResponse.json({ ok: true, reponse: `Lecture faite, mais ${p.erreur}.`, propositions: [] });
    return NextResponse.json({ ok: true, reponse: "Voici ce que j'ai lu. Décochez ce qui est faux puis validez.", propositions: [p] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "erreur_ia", detail: e instanceof Error ? e.message : "erreur" }, { status: 502 });
  }
}
