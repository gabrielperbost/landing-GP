import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { arrondi, chargerPilotage, compagnieDe, derniersMois, estContrat, moisDe } from "@/lib/gpf/pilotage";
import { primeAnnuelle } from "@/lib/gpf/contrats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Compagnies partenaires avec leurs indicateurs (contrats, primes, commissions, bordereaux).
export async function GET() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { dossiers, insurers, bordereaux, lignes } = await chargerPilotage();
  const { data: regles } = await supabaseAdmin.from("gpf_commission_rules").select("insurer_id");
  const depuis = derniersMois(12)[0];
  const contrats = dossiers.filter(estContrat);
  const liste = insurers.map((i) => {
    const sesContrats = contrats.filter((d) => compagnieDe(d.assureur_nom, insurers) === i.nom);
    const sesBordereaux = bordereaux.filter((b) => b.insurer_id === i.id);
    const dernier = sesBordereaux.map((b) => b.created_at as string).sort().pop() ?? null;
    return {
      id: i.id,
      nom: i.nom,
      actif: i.actif ?? true,
      contact: i.contact ?? null,
      telephone: i.telephone ?? null,
      notes: i.notes ?? null,
      mappingMemorise: Boolean(i.mapping),
      nbRegles: (regles ?? []).filter((r) => r.insurer_id === i.id).length,
      nbContrats: sesContrats.length,
      primes: arrondi(sesContrats.reduce((s, d) => s + (primeAnnuelle(d) ?? 0), 0)),
      commissions12: arrondi(lignes.filter((l) => l.insurer_id === i.id && moisDe(l) >= depuis).reduce((s, l) => s + l.montant, 0)),
      nbBordereaux: sesBordereaux.length,
      aVerifier: sesBordereaux.filter((b) => b.import_statut === "a_verifier").length,
      dernierBordereau: dernier
    };
  });
  return NextResponse.json({ ok: true, compagnies: liste });
}

export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const nom = String(body?.nom ?? "").trim();
  if (!nom) return NextResponse.json({ ok: false, error: "nom_requis" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("gpf_insurers").insert({ nom }).select("*").single();
  if (error) return NextResponse.json({ ok: false, error: error.code === "23505" ? "compagnie_existante" : error.message }, { status: error.code === "23505" ? 409 : 500 });
  return NextResponse.json({ ok: true, compagnie: data });
}

export async function PATCH(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ ok: false, error: "id_requis" }, { status: 400 });
  const patch: Record<string, unknown> = {};
  for (const k of ["contact", "telephone", "notes"]) if (k in body) patch[k] = body[k] || null;
  if ("actif" in body) patch.actif = Boolean(body.actif);
  if (body.oublierMapping === true) patch.mapping = null;
  const { error } = await supabaseAdmin.from("gpf_insurers").update(patch).eq("id", body.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
