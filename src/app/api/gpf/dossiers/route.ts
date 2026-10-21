import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { GPF_STATUTS, GPF_STATUTS_CLOS, type GpfStatut } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NON_CLOS = GPF_STATUTS.filter((s) => !GPF_STATUTS_CLOS.has(s));

// Vue "tableau" (type Monday) : un dossier par ligne, avec le client déjà
// attaché. Pagination côté serveur (50 par défaut) pour ne jamais faire
// rendre des centaines de lignes d'un coup.
export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const pageSize = Math.min(2000, Math.max(1, Number(params.get("pageSize") ?? "50") || 50));
  const statutFilter = params.get("statut")?.trim();
  const produitFilter = params.get("produit")?.trim();
  const q = params.get("q")?.trim();
  const includeClos = params.get("clos") === "1";

  // La recherche porte aussi sur le nom du client : on résout d'abord les
  // clients concernés, puis on les combine en OR avec les colonnes du dossier.
  let matchingClientIds: string[] = [];
  if (q) {
    const { data: matchedClients } = await supabaseAdmin
      .from("gpf_clients")
      .select("id")
      .or(`nom.ilike.%${q}%,prenom.ilike.%${q}%`)
      .limit(500);
    matchingClientIds = (matchedClients ?? []).map((c) => c.id);
  }

  let query = supabaseAdmin.from("gpf_dossiers").select("*", { count: "exact" }).is("deleted_at", null);

  if (statutFilter) {
    query = query.eq("statut", statutFilter);
  } else if (!includeClos) {
    query = query.in("statut", NON_CLOS);
  }
  if (produitFilter) query = query.eq("produit", produitFilter);
  if (q) {
    const orParts = [`assureur_nom.ilike.%${q}%`, `source.ilike.%${q}%`];
    if (matchingClientIds.length) orParts.push(`client_id.in.(${matchingClientIds.join(",")})`);
    query = query.or(orParts.join(","));
  }

  query = query.order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);

  const { data: dossiers, error, count } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const clientIds = Array.from(new Set((dossiers ?? []).flatMap((d) => [d.client_id, d.co_client_id]).filter(Boolean) as string[]));
  let clientById = new Map<string, { id: string; prenom: string; nom: string }>();
  if (clientIds.length) {
    const { data: clients } = await supabaseAdmin.from("gpf_clients").select("id, prenom, nom").in("id", clientIds);
    clientById = new Map((clients ?? []).map((c) => [c.id, c]));
  }

  const items = (dossiers ?? []).map((d) => ({
    ...d,
    client: clientById.get(d.client_id) ?? null,
    co_client: d.co_client_id ? clientById.get(d.co_client_id) ?? null : null
  }));

  // Compteurs par statut pour les chips de filtre : une seule colonne, tous
  // les dossiers non supprimés (indépendant de la pagination et du filtre
  // "clos" courant, pour que les chips restent stables).
  const { data: statutRows } = await supabaseAdmin.from("gpf_dossiers").select("statut").is("deleted_at", null);
  const countsByStatut: Record<string, number> = {};
  for (const row of statutRows ?? []) {
    const s = row.statut as GpfStatut;
    countsByStatut[s] = (countsByStatut[s] ?? 0) + 1;
  }

  return NextResponse.json({
    ok: true,
    dossiers: items,
    total: count ?? items.length,
    page,
    pageSize,
    countsByStatut
  });
}
