import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { GPF_CALL_RESULTAT_LABEL, GPF_NOTE_CATEGORIE_LABEL, GPF_PRODUIT_LABEL, GPF_STATUT_LABEL, type GpfProduit, type GpfStatut } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Evenement = { id: string; type: "appel" | "note" | "statut" | "document" | "rdv" | "tache" | "activite"; date: string; titre: string; detail?: string | null };

/**
 * Historique unifié d'un contact : appels, notes, changements de statut,
 * documents, rendez-vous, tâches terminées, dans un seul fil chronologique.
 * Chaque source est lue indépendamment : une table absente ne bloque pas le reste.
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const id = params.id;

  const { data: dossiers } = await supabaseAdmin.from("gpf_dossiers").select("id, produit").or(`client_id.eq.${id},co_client_id.eq.${id}`);
  const dossierIds = (dossiers ?? []).map((d) => d.id);
  const produitById = new Map((dossiers ?? []).map((d) => [d.id, GPF_PRODUIT_LABEL[d.produit as GpfProduit]]));
  const inDossiers = dossierIds.length ? dossierIds : ["00000000-0000-0000-0000-000000000000"];

  const [calls, notes, statuts, docs, rdv, taches, created] = await Promise.all([
    supabaseAdmin.from("gpf_calls").select("*").eq("client_id", id),
    supabaseAdmin.from("gpf_notes").select("*").eq("client_id", id).is("deleted_at", null),
    supabaseAdmin.from("gpf_status_history").select("*").in("dossier_id", inDossiers),
    supabaseAdmin.from("gpf_documents").select("id, type, nom_fichier, created_at, dossier_id").in("dossier_id", inDossiers),
    supabaseAdmin.from("gpf_appointments").select("*").eq("client_id", id).is("deleted_at", null),
    supabaseAdmin.from("gpf_tasks").select("*").eq("client_id", id).eq("etat", "terminee"),
    supabaseAdmin.from("gpf_clients").select("created_at").eq("id", id).single()
  ]);

  const ev: Evenement[] = [];
  for (const c of calls.data ?? [])
    ev.push({ id: `c${c.id}`, type: "appel", date: c.created_at, titre: `Appel — ${GPF_CALL_RESULTAT_LABEL[c.resultat as keyof typeof GPF_CALL_RESULTAT_LABEL]}`, detail: c.note });
  for (const n of notes.data ?? [])
    ev.push({ id: `n${n.id}`, type: "note", date: n.created_at, titre: `Note — ${GPF_NOTE_CATEGORIE_LABEL[n.categorie as keyof typeof GPF_NOTE_CATEGORIE_LABEL]}`, detail: n.contenu });
  for (const s of statuts.data ?? [])
    ev.push({
      id: `s${s.id}`,
      type: "statut",
      date: s.changed_at,
      titre: `${produitById.get(s.dossier_id) ?? "Dossier"} : ${s.ancien_statut ? `${GPF_STATUT_LABEL[s.ancien_statut as GpfStatut] ?? s.ancien_statut} → ` : "créé — "}${GPF_STATUT_LABEL[s.nouveau_statut as GpfStatut] ?? s.nouveau_statut}`,
      detail: s.note
    });
  for (const d of docs.data ?? []) ev.push({ id: `d${d.id}`, type: "document", date: d.created_at, titre: `Document ajouté — ${d.type}`, detail: d.nom_fichier });
  for (const r of rdv.data ?? []) ev.push({ id: `r${r.id}`, type: "rdv", date: r.debut, titre: `Rendez-vous — ${r.titre}`, detail: r.lieu ?? r.lien_visio });
  for (const t of taches.data ?? []) ev.push({ id: `t${t.id}`, type: "tache", date: t.done_at ?? t.created_at, titre: `Tâche terminée — ${t.titre}`, detail: t.notes });
  if (created.data) ev.push({ id: "creation", type: "activite", date: created.data.created_at, titre: "Fiche créée" });

  ev.sort((a, b) => (a.date < b.date ? 1 : -1));
  return NextResponse.json({ ok: true, evenements: ev });
}
