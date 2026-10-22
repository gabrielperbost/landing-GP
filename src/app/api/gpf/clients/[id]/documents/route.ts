import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/gpf/activityLog";
import { notify } from "@/lib/gpf/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "gpf-documents";

// Tous les documents d'un contact (déposés sur la fiche ou sur un de ses dossiers).
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { data: dossiers } = await supabaseAdmin.from("gpf_dossiers").select("id").or(`client_id.eq.${params.id},co_client_id.eq.${params.id}`);
  const dossierIds = (dossiers ?? []).map((d) => d.id);
  const ors = [`client_id.eq.${params.id}`];
  if (dossierIds.length) ors.push(`dossier_id.in.(${dossierIds.join(",")})`);
  let { data, error } = await supabaseAdmin.from("gpf_documents").select("*").or(ors.join(",")).is("deleted_at", null).order("created_at", { ascending: false });
  // Avant la migration 007 (pas de colonne client_id), on se limite aux documents des dossiers.
  if (error && dossierIds.length) {
    ({ data, error } = await supabaseAdmin.from("gpf_documents").select("*").in("dossier_id", dossierIds).is("deleted_at", null).order("created_at", { ascending: false }));
  }
  if (error) return NextResponse.json({ ok: true, documents: [] });
  return NextResponse.json({ ok: true, documents: data ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const type = (form?.get("type") as string | null)?.trim() || "Autre";
  const dossierId = (form?.get("dossier_id") as string | null) || null;
  const dateExpiration = (form?.get("date_expiration") as string | null) || null;
  if (!file || !(file instanceof File)) return NextResponse.json({ ok: false, error: "fichier_requis" }, { status: 400 });

  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const storagePath = `clients/${params.id}/${crypto.randomUUID()}${ext}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, Buffer.from(await file.arrayBuffer()), { contentType: file.type || "application/octet-stream" });
  if (uploadError) return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from("gpf_documents")
    .insert({
      client_id: params.id,
      dossier_id: dossierId,
      type,
      recu: true,
      nom_fichier: file.name,
      storage_path: storagePath,
      taille_octets: file.size,
      date_reception: new Date().toISOString().slice(0, 10),
      date_expiration: dateExpiration
    })
    .select("*")
    .single();
  if (error) {
    await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Une pièce d'identité déposée coche la conformité correspondante.
  if (/^(cni|pi[eè]ce d'identit|passeport|titre de s[eé]jour)/i.test(type)) {
    await supabaseAdmin
      .from("gpf_compliance")
      .upsert(
        { client_id: params.id, type: "piece_identite", statut: "fait", pourcentage: 100, date_expiration: dateExpiration, document_id: data.id, updated_at: new Date().toISOString() },
        { onConflict: "client_id,type" }
      );
  }
  await logActivity("create", "document", data.id, `${type} · ${file.name}`);
  await notify("piece_recue", `Pièce reçue : ${type}`, file.name, `/gpf/contacts/${params.id}?onglet=documents`);
  return NextResponse.json({ ok: true, document: data });
}
