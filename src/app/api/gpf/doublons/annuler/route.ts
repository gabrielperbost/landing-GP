import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/gpf/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Annule une fusion : remet les champs complétés à leur état d'avant,
// rattache dossiers/documents à la fiche d'origine et la sort de la corbeille.
export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const mergeLogId = body?.mergeLogId as string | undefined;
  if (!mergeLogId) return NextResponse.json({ ok: false, error: "parametres_invalides" }, { status: 400 });

  const { data: log } = await supabaseAdmin.from("gpf_merges").select("*").eq("id", mergeLogId).eq("undone", false).single();
  if (!log) return NextResponse.json({ ok: false, error: "introuvable" }, { status: 404 });

  const table = log.entity_type === "client" ? "gpf_clients" : "gpf_dossiers";
  const snap = log.snapshot as {
    merged: Record<string, unknown>;
    keptBefore: Record<string, unknown>;
    movedAsClient?: string[];
    movedAsCo?: string[];
    movedDocuments?: string[];
  };

  // La fiche fusionnée doit encore exister (non purgée après 30 jours).
  const { data: merged } = await supabaseAdmin.from(table).select("id").eq("id", log.merged_id).single();
  if (!merged) return NextResponse.json({ ok: false, error: "fiche_purgee" }, { status: 410 });

  await supabaseAdmin.from(table).update({ deleted_at: null }).eq("id", log.merged_id);
  if (Object.keys(snap.keptBefore ?? {}).length) await supabaseAdmin.from(table).update(snap.keptBefore).eq("id", log.kept_id);

  if (log.entity_type === "client") {
    if (snap.movedAsClient?.length) await supabaseAdmin.from("gpf_dossiers").update({ client_id: log.merged_id }).in("id", snap.movedAsClient);
    if (snap.movedAsCo?.length) await supabaseAdmin.from("gpf_dossiers").update({ co_client_id: log.merged_id }).in("id", snap.movedAsCo);
  } else if (snap.movedDocuments?.length) {
    await supabaseAdmin.from("gpf_documents").update({ dossier_id: log.merged_id }).in("id", snap.movedDocuments);
  }

  await supabaseAdmin.from("gpf_merges").update({ undone: true }).eq("id", mergeLogId);
  await logActivity("restore", log.entity_type, log.merged_id, "Annulation d'une fusion");

  return NextResponse.json({ ok: true });
}
