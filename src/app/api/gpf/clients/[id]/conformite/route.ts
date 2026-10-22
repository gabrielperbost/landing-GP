import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/gpf/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = ["collecte", "lcb_ft", "der", "lettre_mission", "piece_identite", "profil", "objectifs", "rapport_adequation"];
const STATUTS = ["manquant", "en_cours", "fait"];

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin.from("gpf_compliance").select("*").eq("client_id", params.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, items: data ?? [] });
}

// Met à jour un élément de la checklist réglementaire (création si absent).
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || !TYPES.includes(body.type) || !STATUTS.includes(body.statut)) {
    return NextResponse.json({ ok: false, error: "parametres_invalides" }, { status: 400 });
  }
  const { error } = await supabaseAdmin.from("gpf_compliance").upsert(
    {
      client_id: params.id,
      type: body.type,
      statut: body.statut,
      pourcentage: body.statut === "en_cours" ? Math.max(0, Math.min(100, Number(body.pourcentage) || 0)) : body.statut === "fait" ? 100 : 0,
      date_signature: body.date_signature || null,
      date_expiration: body.date_expiration || null,
      document_id: body.document_id ?? null,
      updated_at: new Date().toISOString()
    },
    { onConflict: "client_id,type" }
  );
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await logActivity("update", "client", params.id, `Conformité : ${body.type} → ${body.statut}`);
  return NextResponse.json({ ok: true });
}
