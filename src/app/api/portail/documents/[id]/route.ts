import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { clientPortail } from "@/lib/gpf/portail";
import { BUCKET } from "@/lib/gpf/documentsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Téléchargement d'un document par le client : uniquement les siens, partagés ou à signer.
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const clientId = await clientPortail();
  if (!clientId) return NextResponse.json({ ok: false, error: "non_connecte" }, { status: 401 });
  const [{ data: doc }, { data: conf }] = await Promise.all([
    supabaseAdmin.from("gpf_documents").select("id, client_id, storage_path, nom_fichier, visible_client, depose_par_client").eq("id", params.id).is("deleted_at", null).single(),
    supabaseAdmin.from("gpf_compliance").select("document_id").eq("client_id", clientId).eq("signature_statut", "a_signer")
  ]);
  const aSigner = (conf ?? []).some((x) => x.document_id === params.id);
  if (!doc || doc.client_id !== clientId || !doc.storage_path || !(doc.visible_client || doc.depose_par_client || aSigner)) {
    return NextResponse.json({ ok: false, error: "introuvable" }, { status: 404 });
  }
  const { data: signed } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60, { download: doc.nom_fichier ?? true });
  if (!signed) return NextResponse.json({ ok: false, error: "indisponible" }, { status: 500 });
  await supabaseAdmin.from("gpf_document_access").insert({ document_id: doc.id, action: "portail_client" });
  return NextResponse.json({ ok: true, url: signed.signedUrl });
}
