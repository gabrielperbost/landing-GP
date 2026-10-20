import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { GPF_PRODUITS, GPF_STATUTS } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = params;
  const body = await request.json().catch(() => null);

  if (!body?.produit || !(GPF_PRODUITS as readonly string[]).includes(body.produit)) {
    return NextResponse.json({ ok: false, error: "produit_invalide" }, { status: 400 });
  }
  const statut = body.statut && (GPF_STATUTS as readonly string[]).includes(body.statut) ? body.statut : "a_traiter";

  const { data, error } = await supabaseAdmin
    .from("gpf_dossiers")
    .insert({
      client_id: id,
      co_client_id: body.co_client_id || null,
      produit: body.produit,
      statut,
      source: body.source || null
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  await supabaseAdmin.from("gpf_status_history").insert({ dossier_id: data.id, ancien_statut: null, nouveau_statut: statut });

  return NextResponse.json({ ok: true, dossier: data });
}
