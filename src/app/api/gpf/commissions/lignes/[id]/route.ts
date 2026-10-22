import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { majCompteurs } from "@/lib/gpf/rapprochement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Correction manuelle d'une ligne : rattachement à un contrat, ou ligne ignorée.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if ("dossier_id" in body) {
    patch.dossier_id = body.dossier_id || null;
    patch.rapprochement = body.dossier_id ? "rapproche" : "sans_contrat";
    patch.rapprochement_manuel = true;
  }
  if (body.ignorer === true) patch.rapprochement = "ignore";
  if (body.accepter_ecart === true) patch.rapprochement = "rapproche";

  const { data, error } = await supabaseAdmin.from("gpf_commission_lines").update(patch).eq("id", params.id).select("bordereau_id").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await majCompteurs(data.bordereau_id);
  return NextResponse.json({ ok: true });
}
