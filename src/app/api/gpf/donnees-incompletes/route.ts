import { NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dossiers effectifs auxquels il manque une donnée utile au pilotage
// (assureur, prime, date d'effet, commission), à compléter au fil de l'eau.
export async function GET() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { data: dossiers, error } = await supabaseAdmin
    .from("gpf_dossiers")
    .select(
      "id, client_id, produit, statut, assureur_nom, date_effet, prime_mensuelle, prime_annuelle, placement_initial, placement_mensuel, frais_dossier, precompte_lineaire_1ere_annee, lineaire_n1"
    )
    .eq("statut", "effectif")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const items = (dossiers ?? [])
    .map((d) => {
      const manque: string[] = [];
      if (!d.assureur_nom?.trim()) manque.push("assureur");
      if (d.prime_mensuelle == null && d.prime_annuelle == null && d.placement_initial == null && d.placement_mensuel == null) manque.push("prime");
      if (!d.date_effet) manque.push("date_effet");
      if (d.precompte_lineaire_1ere_annee == null && d.lineaire_n1 == null) manque.push("commission");
      return { ...d, manque };
    })
    .filter((d) => d.manque.length > 0);

  const clientIds = Array.from(new Set(items.map((d) => d.client_id)));
  let clientById = new Map<string, { id: string; prenom: string; nom: string }>();
  if (clientIds.length) {
    const { data: clients } = await supabaseAdmin.from("gpf_clients").select("id, prenom, nom").in("id", clientIds);
    clientById = new Map((clients ?? []).map((c) => [c.id, c]));
  }

  return NextResponse.json({ ok: true, dossiers: items.map((d) => ({ ...d, client: clientById.get(d.client_id) ?? null })) });
}
