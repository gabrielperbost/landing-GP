import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { genererCourrier, TYPES_COURRIER } from "@/lib/gpf/courriers";
import { GPF_STATUTS_CLOS, formatNom, type GpfStatut } from "@/lib/gpf/types";
import type { TypeCourrier } from "@/lib/gpf/modeles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Courriers existants + dossiers pour lesquels une lettre de résiliation peut être préparée. */
export async function GET() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const [{ data: courriers, error }, { data: dossiers }, { data: clients }] = await Promise.all([
    supabaseAdmin.from("gpf_courriers").select("*").order("created_at", { ascending: false }).limit(500),
    supabaseAdmin.from("gpf_dossiers").select("id, client_id, produit, statut, contrat_statut, assureur_nom, banque, reference_contrat, date_effet, date_echeance").is("deleted_at", null),
    supabaseAdmin.from("gpf_clients").select("id, prenom, nom, adresse, code_postal, ville").is("deleted_at", null)
  ]);
  if (error) return NextResponse.json({ ok: true, disponible: false, courriers: [], eligibles: [] });
  const clientBy = new Map((clients ?? []).map((c) => [c.id, c]));
  const dossierBy = new Map((dossiers ?? []).map((d) => [d.id, d]));
  const avecCourrier = new Set((courriers ?? []).map((c) => c.dossier_id));

  // Affaires en cours sur des produits résiliables : l'ancien contrat du client est à résilier.
  const eligibles = (dossiers ?? [])
    .filter((d) => ["assurance_emprunteur", "mutuelle", "prevoyance"].includes(d.produit) && !GPF_STATUTS_CLOS.has(d.statut as GpfStatut) && d.statut !== "effectif" && !d.contrat_statut)
    .map((d) => {
      const c = clientBy.get(d.client_id);
      return {
        ...d,
        client: formatNom(c ?? null),
        adresseComplete: Boolean(c?.adresse && c?.code_postal && c?.ville),
        typeSuggere: (d.produit === "assurance_emprunteur" ? "resiliation_lemoine" : "resiliation_hamon") as TypeCourrier,
        dejaPrepare: avecCourrier.has(d.id)
      };
    });

  return NextResponse.json({
    ok: true,
    disponible: true,
    courriers: (courriers ?? []).map((c) => ({ ...c, client: formatNom(clientBy.get(c.client_id) ?? null), dossier: c.dossier_id ? dossierBy.get(c.dossier_id) ?? null : null })),
    eligibles
  });
}

/** Génération unitaire ou en lot : un brouillon par dossier, à contrôler avant envoi. */
export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const items: { dossier_id?: string; client_id?: string; type: TypeCourrier; donnees?: Record<string, string> }[] = Array.isArray(body?.items) ? body.items : [];
  if (!items.length || items.length > 50) return NextResponse.json({ ok: false, error: "items_invalides" }, { status: 400 });

  const crees: string[] = [];
  const erreurs: string[] = [];
  for (const it of items) {
    if (!TYPES_COURRIER.includes(it.type)) continue;
    let clientId = it.client_id ?? null;
    if (!clientId && it.dossier_id) {
      const { data: d } = await supabaseAdmin.from("gpf_dossiers").select("client_id, banque").eq("id", it.dossier_id).single();
      clientId = d?.client_id ?? null;
      if (it.type === "resiliation_lemoine" && !it.donnees?.destinataire && d?.banque) it.donnees = { ...it.donnees, destinataire: d.banque };
    }
    if (!clientId) continue;
    try {
      const doc = await genererCourrier(clientId, it.dossier_id ?? null, it.type, it.donnees ?? {});
      const { data } = await supabaseAdmin
        .from("gpf_courriers")
        .insert({ client_id: clientId, dossier_id: it.dossier_id ?? null, type: it.type, statut: "brouillon", donnees: it.donnees ?? {}, document_id: doc.id })
        .select("id")
        .single();
      if (data) crees.push(data.id);
    } catch (e) {
      erreurs.push(e instanceof Error ? e.message : "erreur");
    }
  }
  return NextResponse.json({ ok: true, crees: crees.length, erreurs });
}
