import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { GPF_PRODUITS } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const num = (v: unknown) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v));

export async function GET() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const [{ data, error }, { data: insurers }] = await Promise.all([
    supabaseAdmin.from("gpf_commission_rules").select("*").order("produit"),
    supabaseAdmin.from("gpf_insurers").select("id, nom").order("nom")
  ]);
  // Avant la migration 008, la table des règles n'existe pas : liste vide, compagnies quand même.
  return NextResponse.json({ ok: true, regles: error ? [] : data ?? [], insurers: insurers ?? [], disponible: !error });
}

// Création ou mise à jour (une règle par compagnie et par produit).
export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || !GPF_PRODUITS.includes(body.produit)) return NextResponse.json({ ok: false, error: "produit_requis" }, { status: 400 });
  const row = {
    insurer_id: body.insurer_id || null,
    produit: body.produit,
    mode: body.mode === "lineaire" ? "lineaire" : "precompte",
    taux_annee1: num(body.taux_annee1),
    taux_suivantes: num(body.taux_suivantes),
    frais_dossier: num(body.frais_dossier),
    reprise_mois: num(body.reprise_mois),
    notes: body.notes || null
  };
  const q = body.id
    ? supabaseAdmin.from("gpf_commission_rules").update(row).eq("id", body.id).select("*").single()
    : supabaseAdmin.from("gpf_commission_rules").insert(row).select("*").single();
  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.code === "23505" ? "regle_existante" : error.message }, { status: error.code === "23505" ? 409 : 500 });
  return NextResponse.json({ ok: true, regle: data });
}

export async function DELETE(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id_requis" }, { status: 400 });
  const { error } = await supabaseAdmin.from("gpf_commission_rules").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
