import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/gpf/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLIENT_FIELDS = ["civilite", "email", "telephone", "adresse", "ville", "code_postal", "annee_naissance", "profession", "fumeur", "notes"];
const DOSSIER_FIELDS = [
  "source", "assureur_nom", "reference_contrat", "montant_pret", "taux", "duree_mois", "date_effet", "placement_initial",
  "placement_mensuel", "frais_gestion_pct", "lien_dossier", "date_depot", "remuneration_apporteur_pct", "frais_dossier",
  "precompte_lineaire_1ere_annee", "lineaire_n1", "frais_entree", "prime_mensuelle", "prime_annuelle"
];

const isEmpty = (v: unknown) => v == null || (typeof v === "string" && v.trim() === "");

// Fusion manuelle, déclenchée seulement après confirmation dans l'interface.
// La fiche gardée ne perd rien : seuls ses champs vides sont complétés. Tout
// ce qui est déplacé est noté dans gpf_merges pour permettre l'annulation.
export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const type = body?.type as "client" | "dossier" | undefined;
  const keepId = body?.keepId as string | undefined;
  const mergeId = body?.mergeId as string | undefined;
  if (!type || !keepId || !mergeId || keepId === mergeId || !["client", "dossier"].includes(type)) {
    return NextResponse.json({ ok: false, error: "parametres_invalides" }, { status: 400 });
  }

  const table = type === "client" ? "gpf_clients" : "gpf_dossiers";
  const fields = type === "client" ? CLIENT_FIELDS : DOSSIER_FIELDS;

  const [{ data: keep }, { data: merge }] = await Promise.all([
    supabaseAdmin.from(table).select("*").eq("id", keepId).is("deleted_at", null).single(),
    supabaseAdmin.from(table).select("*").eq("id", mergeId).is("deleted_at", null).single()
  ]);
  if (!keep || !merge) return NextResponse.json({ ok: false, error: "introuvable" }, { status: 404 });

  const patch: Record<string, unknown> = {};
  const keptBefore: Record<string, unknown> = {};
  for (const f of fields) {
    if (isEmpty(keep[f]) && !isEmpty(merge[f])) {
      patch[f] = merge[f];
      keptBefore[f] = keep[f];
    }
  }

  let snapshot: Record<string, unknown>;
  if (type === "client") {
    const [{ data: asClient }, { data: asCo }] = await Promise.all([
      supabaseAdmin.from("gpf_dossiers").select("id").eq("client_id", mergeId),
      supabaseAdmin.from("gpf_dossiers").select("id").eq("co_client_id", mergeId)
    ]);
    snapshot = {
      merged: merge,
      keptBefore,
      movedAsClient: (asClient ?? []).map((d) => d.id),
      movedAsCo: (asCo ?? []).map((d) => d.id)
    };
  } else {
    const { data: docs } = await supabaseAdmin.from("gpf_documents").select("id").eq("dossier_id", mergeId);
    snapshot = { merged: merge, keptBefore, movedDocuments: (docs ?? []).map((d) => d.id) };
  }

  // Le journal est écrit en premier : si la table n'existe pas encore
  // (migration 004 non passée), on s'arrête avant d'avoir touché aux données.
  const { data: log, error: logError } = await supabaseAdmin
    .from("gpf_merges")
    .insert({ entity_type: type, kept_id: keepId, merged_id: mergeId, snapshot })
    .select("id")
    .single();
  if (logError || !log) return NextResponse.json({ ok: false, error: logError?.message ?? "journal_impossible" }, { status: 500 });

  if (Object.keys(patch).length) await supabaseAdmin.from(table).update({ ...patch, updated_at: new Date().toISOString() }).eq("id", keepId);

  if (type === "client") {
    await supabaseAdmin.from("gpf_dossiers").update({ client_id: keepId }).eq("client_id", mergeId);
    await supabaseAdmin.from("gpf_dossiers").update({ co_client_id: keepId }).eq("co_client_id", mergeId);
  } else {
    await supabaseAdmin.from("gpf_documents").update({ dossier_id: keepId }).eq("dossier_id", mergeId);
  }
  await supabaseAdmin.from(table).update({ deleted_at: new Date().toISOString() }).eq("id", mergeId);

  const resume =
    type === "client" ? `Fusion de ${merge.prenom} ${merge.nom} dans ${keep.prenom} ${keep.nom}` : `Fusion d'un dossier ${merge.produit} en double`;
  await logActivity("update", type, keepId, resume);

  return NextResponse.json({ ok: true, mergeLogId: log.id });
}
