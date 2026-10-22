import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { GPF_STATUTS, GPF_STATUTS_CLOS, GPF_STATUTS_SIGNES, type GpfStatut } from "@/lib/gpf/types";

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
  // vue=affaires : pipeline commercial (pas encore signé) ; vue=contrats : signés.
  const vue = params.get("vue");
  const contratStatut = params.get("contrat_statut")?.trim();

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

  // Tant que la migration 006 (colonne contrat_statut) n'est pas appliquée,
  // un dossier Effectif est considéré comme un contrat actif.
  const { error: colError } = await supabaseAdmin.from("gpf_dossiers").select("contrat_statut").limit(1);
  const legacy = Boolean(colError);
  const SIGNES = [...GPF_STATUTS_SIGNES];

  let query = supabaseAdmin.from("gpf_dossiers").select("*", { count: "exact" }).is("deleted_at", null);

  if (vue === "affaires") query = legacy ? query.not("statut", "in", `(${SIGNES.join(",")})`) : query.is("contrat_statut", null);
  if (vue === "contrats") query = legacy ? query.in("statut", SIGNES) : query.not("contrat_statut", "is", null);
  if (contratStatut) query = legacy ? (contratStatut === "actif" ? query : query.eq("id", "00000000-0000-0000-0000-000000000000")) : query.eq("contrat_statut", contratStatut);

  if (statutFilter) {
    query = query.eq("statut", statutFilter);
  } else if (!includeClos && vue !== "contrats") {
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
    // nrp_count existe depuis la migration 007 (pastille NRP du Kanban).
    const avecNrp = await supabaseAdmin.from("gpf_clients").select("id, prenom, nom, nrp_count").in("id", clientIds);
    const clients: { id: string; prenom: string; nom: string }[] | null = avecNrp.error
      ? (await supabaseAdmin.from("gpf_clients").select("id, prenom, nom").in("id", clientIds)).data
      : avecNrp.data;
    clientById = new Map((clients ?? []).map((c) => [c.id, c as { id: string; prenom: string; nom: string }]));
  }

  const items = (dossiers ?? []).map((d) => ({
    ...d,
    ...(legacy ? { contrat_statut: GPF_STATUTS_SIGNES.has(d.statut) ? "actif" : null } : {}),
    client: clientById.get(d.client_id) ?? null,
    co_client: d.co_client_id ? clientById.get(d.co_client_id) ?? null : null
  }));

  // Compteurs par statut pour les chips de filtre : une seule colonne, tous
  // les dossiers non supprimés (indépendant de la pagination et du filtre
  // "clos" courant, pour que les chips restent stables).
  const { data: allRows } = await supabaseAdmin
    .from("gpf_dossiers")
    .select(legacy ? "statut" : "statut, contrat_statut")
    .is("deleted_at", null);
  const statutRows = ((allRows ?? []) as unknown as { statut: string; contrat_statut?: string | null }[])
    .map((r) => ({ statut: r.statut, contrat_statut: legacy ? (GPF_STATUTS_SIGNES.has(r.statut) ? "actif" : null) : r.contrat_statut ?? null }))
    .filter((r) => (vue === "affaires" ? !r.contrat_statut : vue === "contrats" ? Boolean(r.contrat_statut) : true));
  const countsByStatut: Record<string, number> = {};
  const countsByContratStatut: Record<string, number> = {};
  for (const row of statutRows ?? []) {
    const s = row.statut as GpfStatut;
    countsByStatut[s] = (countsByStatut[s] ?? 0) + 1;
    if (row.contrat_statut) countsByContratStatut[row.contrat_statut] = (countsByContratStatut[row.contrat_statut] ?? 0) + 1;
  }

  return NextResponse.json({
    ok: true,
    dossiers: items,
    total: count ?? items.length,
    page,
    pageSize,
    countsByStatut,
    countsByContratStatut
  });
}
