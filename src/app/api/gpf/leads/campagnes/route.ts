import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { CAMPAGNES_LEADS, ETAPES_CAMPAGNE, type EtapeCampagne } from "@/lib/gpf/campagnesLeads";
import { formatNom } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ligne = {
  id: string;
  campagne: string;
  client_id: string;
  email: string | null;
  canal: string | null;
  inscrit_at: string;
  etape: EtapeCampagne;
  etape_at: string | null;
  ca: number | string | null;
  client: { prenom: string; nom: string; type_contact?: string | null; raison_sociale?: string | null; telephone: string | null } | null;
};

/**
 * Statistiques par campagne (inscrits, prises de RDV, clients, CA généré) et, avec ?campagne=…,
 * la liste de ses leads pour les faire avancer.
 */
export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("gpf_campagne_leads")
    .select("id, campagne, client_id, email, canal, inscrit_at, etape, etape_at, ca, client:gpf_clients(prenom, nom, type_contact, raison_sociale, telephone)")
    .order("inscrit_at", { ascending: false });
  // Table absente : migration 015 pas encore appliquée (Paramètres → Mettre à jour la base).
  if (error) return NextResponse.json({ ok: true, migrationRequise: true, campagnes: [], lignes: [] });
  const lignes = (data ?? []) as unknown as Ligne[];

  const campagnes = CAMPAGNES_LEADS.map((c) => {
    const l = lignes.filter((x) => x.campagne === c.id);
    const clients = l.filter((x) => x.etape === "client");
    const ca = clients.reduce((s, x) => s + (Number(x.ca) || 0), 0);
    const canaux = new Map<string, number>();
    for (const x of l) canaux.set(x.canal ?? "direct", (canaux.get(x.canal ?? "direct") ?? 0) + 1);
    return {
      id: c.id,
      libelle: c.libelle,
      inscrits: l.length,
      rdv: l.filter((x) => x.etape === "rdv" || x.etape === "client").length,
      clients: clients.length,
      ca,
      caParInscrit: l.length ? ca / l.length : null,
      canaux: Array.from(canaux, ([canal, n]) => ({ canal, n })).sort((a, b) => b.n - a.n)
    };
  });

  const choisie = request.nextUrl.searchParams.get("campagne");
  return NextResponse.json({
    ok: true,
    campagnes,
    lignes: choisie
      ? lignes
          .filter((x) => x.campagne === choisie)
          .map((x) => ({ id: x.id, client_id: x.client_id, nom: formatNom(x.client), telephone: x.client?.telephone ?? null, email: x.email, canal: x.canal, inscrit_at: x.inscrit_at, etape: x.etape, ca: x.ca == null ? null : Number(x.ca) }))
      : []
  });
}

/** Fait avancer un lead : étape (inscrit, prise de RDV, devenu client) et CA généré. */
export async function PATCH(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ ok: false, error: "id_manquant" }, { status: 400 });
  const maj: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.etape !== undefined) {
    if (!(ETAPES_CAMPAGNE as readonly string[]).includes(body.etape)) return NextResponse.json({ ok: false, error: "etape_invalide" }, { status: 400 });
    maj.etape = body.etape;
    maj.etape_at = new Date().toISOString();
  }
  if (body.ca !== undefined) {
    const ca = body.ca === null || body.ca === "" ? null : Number(String(body.ca).replace(",", "."));
    if (ca !== null && (!Number.isFinite(ca) || ca < 0)) return NextResponse.json({ ok: false, error: "ca_invalide" }, { status: 400 });
    maj.ca = ca;
  }
  const { error } = await supabaseAdmin.from("gpf_campagne_leads").update(maj).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
