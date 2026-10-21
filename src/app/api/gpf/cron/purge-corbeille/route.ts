import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "gpf-documents";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const provided = request.headers.get("authorization")?.replace("Bearer ", "");
  return provided === secret;
}

// Purge définitive de ce qui est dans la corbeille depuis plus de 30 jours.
// Appelé une fois par jour par Vercel Cron (voir vercel.json).
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data: oldDocuments } = await supabaseAdmin.from("gpf_documents").select("id, storage_path").lt("deleted_at", cutoff).not("deleted_at", "is", null);
  const storagePaths = (oldDocuments ?? []).map((d) => d.storage_path).filter((p): p is string => Boolean(p));
  if (storagePaths.length) await supabaseAdmin.storage.from(BUCKET).remove(storagePaths);

  const { count: documentsCount } = await supabaseAdmin
    .from("gpf_documents")
    .delete({ count: "exact" })
    .lt("deleted_at", cutoff)
    .not("deleted_at", "is", null);

  const { count: dossiersCount } = await supabaseAdmin.from("gpf_dossiers").delete({ count: "exact" }).lt("deleted_at", cutoff).not("deleted_at", "is", null);

  const { count: clientsCount } = await supabaseAdmin.from("gpf_clients").delete({ count: "exact" }).lt("deleted_at", cutoff).not("deleted_at", "is", null);

  return NextResponse.json({ ok: true, purged: { clients: clientsCount ?? 0, dossiers: dossiersCount ?? 0, documents: documentsCount ?? 0 } });
}
