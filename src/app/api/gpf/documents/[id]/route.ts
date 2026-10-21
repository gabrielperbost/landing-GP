import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/gpf/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "gpf-documents";

// Renvoie une URL signée de courte durée : le bucket est privé, comme le reste
// de GPF (aucun accès public, tout passe par le service role côté serveur).
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { data: doc, error } = await supabaseAdmin.from("gpf_documents").select("storage_path, nom_fichier").eq("id", params.id).single();
  if (error || !doc?.storage_path) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const { data: signed, error: signError } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60);
  if (signError || !signed) return NextResponse.json({ ok: false, error: signError?.message ?? "signing_failed" }, { status: 500 });

  return NextResponse.json({ ok: true, url: signed.signedUrl, nom_fichier: doc.nom_fichier });
}

// Suppression douce : le fichier reste dans le bucket jusqu'à la purge (30
// jours), pour permettre une restauration depuis la corbeille.
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("gpf_documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.id)
    .select("nom_fichier")
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await logActivity("delete", "document", params.id, data?.nom_fichier ?? undefined);
  return NextResponse.json({ ok: true });
}
