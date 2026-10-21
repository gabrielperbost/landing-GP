import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "gpf-documents";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("gpf_documents")
    .select("*")
    .eq("dossier_id", params.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, documents: data ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const dossierId = params.id;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const type = (form?.get("type") as string | null)?.trim() || "Autre";
  if (!file || !(file instanceof File)) return NextResponse.json({ ok: false, error: "fichier_requis" }, { status: 400 });

  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const storagePath = `dossiers/${dossierId}/${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type || "application/octet-stream" });
  if (uploadError) return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from("gpf_documents")
    .insert({
      dossier_id: dossierId,
      type,
      recu: true,
      nom_fichier: file.name,
      storage_path: storagePath,
      taille_octets: file.size,
      date_reception: new Date().toISOString().slice(0, 10)
    })
    .select("*")
    .single();

  if (error) {
    await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, document: data });
}
