import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Journal des accès : pour un document, ou les 200 derniers accès du cabinet.
export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const documentId = request.nextUrl.searchParams.get("document_id");
  let q = supabaseAdmin.from("gpf_document_access").select("*").order("created_at", { ascending: false }).limit(200);
  if (documentId) q = q.eq("document_id", documentId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: true, acces: [] });
  const ids = Array.from(new Set((data ?? []).map((a) => a.document_id)));
  const { data: docs } = ids.length ? await supabaseAdmin.from("gpf_documents").select("id, nom_fichier, type").in("id", ids) : { data: [] };
  const docBy = new Map((docs ?? []).map((d) => [d.id, d]));
  return NextResponse.json({ ok: true, acces: (data ?? []).map((a) => ({ ...a, document: docBy.get(a.document_id) ?? null })) });
}
