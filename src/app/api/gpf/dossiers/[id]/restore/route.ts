import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/gpf/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = params;
  const { data, error } = await supabaseAdmin.from("gpf_dossiers").update({ deleted_at: null }).eq("id", id).select("produit").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await logActivity("restore", "dossier", id, data?.produit);
  return NextResponse.json({ ok: true });
}
