import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Détail d'un bordereau : lignes avec leur contrat rapproché.
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const [{ data: b }, { data: lignes }] = await Promise.all([
    supabaseAdmin.from("gpf_bordereaux").select("*").eq("id", params.id).single(),
    supabaseAdmin.from("gpf_commission_lines").select("*").eq("bordereau_id", params.id).order("rapprochement").order("client_nom_brut")
  ]);
  if (!b) return NextResponse.json({ ok: false, error: "introuvable" }, { status: 404 });
  const dossierIds = Array.from(new Set((lignes ?? []).map((l) => l.dossier_id).filter(Boolean)));
  const { data: dossiers } = dossierIds.length ? await supabaseAdmin.from("gpf_dossiers").select("id, client_id, produit, assureur_nom, reference_contrat").in("id", dossierIds) : { data: [] };
  const clientIds = Array.from(new Set((dossiers ?? []).map((d) => d.client_id)));
  const { data: clients } = clientIds.length ? await supabaseAdmin.from("gpf_clients").select("id, prenom, nom").in("id", clientIds) : { data: [] };
  const clientBy = new Map((clients ?? []).map((c) => [c.id, c]));
  const dossierBy = new Map((dossiers ?? []).map((d) => [d.id, { ...d, client: clientBy.get(d.client_id) ?? null }]));
  const { data: insurer } = b.insurer_id ? await supabaseAdmin.from("gpf_insurers").select("nom").eq("id", b.insurer_id).single() : { data: null };
  return NextResponse.json({
    ok: true,
    bordereau: { ...b, compagnie: insurer?.nom ?? null },
    lignes: (lignes ?? []).map((l) => ({ ...l, dossier: l.dossier_id ? dossierBy.get(l.dossier_id) ?? null : null }))
  });
}

// Validation (prise en compte dans les commissions encaissées) ou annulation de l'import.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const now = new Date().toISOString();
  const patch =
    body?.action === "valider"
      ? { import_statut: "valide", statut_traitement: "valide", valide_at: now, annule_at: null }
      : body?.action === "annuler"
        ? { import_statut: "annule", annule_at: now }
        : body?.action === "rouvrir"
          ? { import_statut: "a_verifier", statut_traitement: "brut", valide_at: null, annule_at: null }
          : null;
  if (!patch) return NextResponse.json({ ok: false, error: "action_invalide" }, { status: 400 });
  const { error } = await supabaseAdmin.from("gpf_bordereaux").update(patch).eq("id", params.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
