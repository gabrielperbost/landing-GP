import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { genererCourrier } from "@/lib/gpf/courriers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Contrôle avant envoi : correction des données (le PDF est régénéré), puis
 * passage « Prêt » et « Envoyé ». L'envoi en recommandé électronique n'est pas
 * branché (service payant) : le courrier est envoyé par vos soins.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const { data: c } = await supabaseAdmin.from("gpf_courriers").select("*").eq("id", params.id).single();
  if (!c) return NextResponse.json({ ok: false, error: "introuvable" }, { status: 404 });

  const patch: Record<string, unknown> = {};
  if (body?.donnees && typeof body.donnees === "object") {
    if (c.statut === "envoye") return NextResponse.json({ ok: false, error: "deja_envoye" }, { status: 409 });
    const donnees = { ...(c.donnees ?? {}), ...body.donnees };
    const doc = await genererCourrier(c.client_id, c.dossier_id, c.type, donnees, c.document_id);
    Object.assign(patch, { donnees, document_id: doc.id, statut: "brouillon" });
  }
  if (["brouillon", "pret", "envoye"].includes(body?.statut)) {
    patch.statut = body.statut;
    patch.envoye_at = body.statut === "envoye" ? new Date().toISOString() : null;
  }
  const { error } = await supabaseAdmin.from("gpf_courriers").update(patch).eq("id", params.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { data: c } = await supabaseAdmin.from("gpf_courriers").select("statut, document_id").eq("id", params.id).single();
  if (!c) return NextResponse.json({ ok: false, error: "introuvable" }, { status: 404 });
  if (c.statut === "envoye") return NextResponse.json({ ok: false, error: "deja_envoye" }, { status: 409 });
  await supabaseAdmin.from("gpf_courriers").delete().eq("id", params.id);
  if (c.document_id) await supabaseAdmin.from("gpf_documents").update({ deleted_at: new Date().toISOString() }).eq("id", c.document_id);
  return NextResponse.json({ ok: true });
}
