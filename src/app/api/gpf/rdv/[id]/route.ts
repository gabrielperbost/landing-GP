import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EDITABLE = ["titre", "debut", "duree_min", "lieu", "lien_visio", "statut", "notes", "client_id"];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  const patch: Record<string, unknown> = {};
  for (const k of EDITABLE) if (k in body) patch[k] = body[k];
  const { error } = await supabaseAdmin.from("gpf_appointments").update(patch).eq("id", params.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { error } = await supabaseAdmin.from("gpf_appointments").update({ deleted_at: new Date().toISOString() }).eq("id", params.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
