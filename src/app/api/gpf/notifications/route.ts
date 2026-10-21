import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const [{ data, error }, { count }] = await Promise.all([
    supabaseAdmin.from("gpf_notifications").select("*").order("created_at", { ascending: false }).limit(30),
    supabaseAdmin.from("gpf_notifications").select("id", { count: "exact", head: true }).eq("lu", false)
  ]);
  if (error) return NextResponse.json({ ok: true, items: [], nonLues: 0 });
  return NextResponse.json({ ok: true, items: data ?? [], nonLues: count ?? 0 });
}

// Marquer une notification (id) ou toutes (tout: true) comme lues.
export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  let query = supabaseAdmin.from("gpf_notifications").update({ lu: true });
  query = body.id ? query.eq("id", body.id) : query.eq("lu", false);
  const { error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
