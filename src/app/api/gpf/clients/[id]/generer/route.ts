import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { genererPdf } from "@/lib/gpf/pdf";
import { DOC_LABEL, modeleDocument, type TypeDocument } from "@/lib/gpf/modeles";
import { enregistrerPdf, nomFichier } from "@/lib/gpf/documentsStore";
import { logActivity } from "@/lib/gpf/activityLog";
import type { GpfClient, GpfDossier } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Élément de la checklist de conformité mis à jour par chaque document.
const CONFORMITE: Record<TypeDocument, string> = { der: "der", lettre_mission: "lettre_mission", recueil: "collecte", rapport_adequation: "rapport_adequation" };

/**
 * Génère un document réglementaire (DER, lettre de mission, recueil des
 * besoins, rapport d'adéquation), le range dans le coffre-fort du client et
 * passe l'élément de conformité « En cours » (à signer).
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const type = body?.type as TypeDocument;
  if (!type || !(type in DOC_LABEL)) return NextResponse.json({ ok: false, error: "type_invalide" }, { status: 400 });

  const [{ data: client }, { data: dossiersAll }, { data: insurers }] = await Promise.all([
    supabaseAdmin.from("gpf_clients").select("*").eq("id", params.id).single(),
    supabaseAdmin.from("gpf_dossiers").select("*").eq("client_id", params.id).is("deleted_at", null),
    supabaseAdmin.from("gpf_insurers").select("*").order("nom")
  ]);
  if (!client) return NextResponse.json({ ok: false, error: "introuvable" }, { status: 404 });
  const ids: string[] = Array.isArray(body.dossier_ids) ? body.dossier_ids : [];
  const ouverts = (dossiersAll ?? []).filter((d) => d.statut !== "refuse" && d.statut !== "sans_suite");
  const dossiers = (ids.length ? (dossiersAll ?? []).filter((d) => ids.includes(d.id)) : ouverts) as GpfDossier[];
  const compagnies = (insurers ?? []).filter((i) => i.actif !== false).map((i) => i.nom as string);

  const { titre, blocs } = modeleDocument(type, client as GpfClient, dossiers, compagnies, { motivation: body.motivation, besoins: body.besoins });
  const octets = await genererPdf(titre, blocs);
  try {
    const doc = await enregistrerPdf(params.id, dossiers.length === 1 ? dossiers[0].id : null, DOC_LABEL[type], nomFichier(DOC_LABEL[type], client), octets);
    const base = { client_id: params.id, type: CONFORMITE[type], statut: "en_cours", pourcentage: 50, document_id: doc.id, updated_at: new Date().toISOString() };
    // signature_statut n'existe qu'après la migration 008 : repli sans.
    const { error } = await supabaseAdmin.from("gpf_compliance").upsert({ ...base, signature_statut: "a_signer" }, { onConflict: "client_id,type" });
    if (error) await supabaseAdmin.from("gpf_compliance").upsert(base, { onConflict: "client_id,type" });
    await logActivity("create", "document", doc.id, `${DOC_LABEL[type]} généré`);
    return NextResponse.json({ ok: true, document: doc });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "erreur" }, { status: 500 });
  }
}
