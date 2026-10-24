import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

export type ContactRow = Record<string, unknown> & {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  created_at: string;
  produits: string[];
  statuts: string[];
  est_client: boolean;
};

export type ContactFilters = {
  q?: string;
  produit?: string;
  segment?: string; // client | lead (prospect)
  provenance?: string;
  type?: string;
  nrp?: boolean;
  sansAction?: boolean;
  du?: string;
  au?: string;
  tri?: string;
  sens?: "asc" | "desc";
};

const SIGNES = new Set(["effectif", "attente_reglement"]);

/**
 * Liste des contacts enrichie (produits, statuts, client ou lead), filtrée et
 * triée côté serveur. Les filtres sur les colonnes récentes se font ici en
 * mémoire, pour fonctionner même avant l'application de la migration 007.
 */
export async function queryContacts(f: ContactFilters) {
  const q = f.q?.trim().replace(/[,()%]/g, " ");
  let query = supabaseAdmin.from("gpf_clients").select("*").is("deleted_at", null).order("nom", { ascending: true });
  if (q) query = query.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,raison_sociale.ilike.%${q}%,email.ilike.%${q}%,telephone.ilike.%${q}%`);

  const [{ data, error }, { data: dossiers }] = await Promise.all([
    query,
    supabaseAdmin.from("gpf_dossiers").select("client_id, co_client_id, produit, statut, source").is("deleted_at", null)
  ]);
  if (error) throw new Error(error.message);

  const produitsBy = new Map<string, Set<string>>();
  const statutsBy = new Map<string, Set<string>>();
  const sourceBy = new Map<string, string>();
  for (const d of dossiers ?? []) {
    for (const cid of [d.client_id, d.co_client_id].filter(Boolean) as string[]) {
      if (!produitsBy.has(cid)) produitsBy.set(cid, new Set());
      produitsBy.get(cid)!.add(d.produit);
      if (!statutsBy.has(cid)) statutsBy.set(cid, new Set());
      statutsBy.get(cid)!.add(d.statut);
      if (d.source && !sourceBy.has(cid)) sourceBy.set(cid, d.source);
    }
  }

  let rows: ContactRow[] = (data ?? []).map((c) => {
    const statuts = [...(statutsBy.get(c.id) ?? [])];
    return {
      ...c,
      provenance: c.provenance ?? sourceBy.get(c.id) ?? null,
      produits: [...(produitsBy.get(c.id) ?? [])],
      statuts,
      est_client: statuts.some((s) => SIGNES.has(s))
    };
  });

  if (f.produit) rows = rows.filter((c) => c.produits.includes(f.produit!));
  if (f.provenance) rows = rows.filter((c) => String(c.provenance ?? "").toLowerCase().includes(f.provenance!.toLowerCase()));
  if (f.type) rows = rows.filter((c) => (c.type_contact ?? "particulier") === f.type);
  if (f.nrp) rows = rows.filter((c) => Number(c.nrp_count ?? 0) > 0 || c.statuts.includes("nrp"));
  if (f.sansAction) rows = rows.filter((c) => !c.prochaine_action && !c.est_client);
  if (f.du) rows = rows.filter((c) => c.created_at >= f.du!);
  if (f.au) rows = rows.filter((c) => c.created_at <= f.au! + "T23:59:59");

  const nbClients = rows.filter((c) => c.est_client).length;
  const counts = { tous: rows.length, client: nbClients, lead: rows.length - nbClients, prospect: rows.length - nbClients };

  if (f.segment === "client") rows = rows.filter((c) => c.est_client);
  if (f.segment === "lead" || f.segment === "prospect") rows = rows.filter((c) => !c.est_client);

  const tri = f.tri ?? "nom";
  const dir = f.sens === "desc" ? -1 : 1;
  const val = (c: ContactRow): string => {
    if (tri === "nom") return `${c.nom} ${c.prenom}`.toLowerCase();
    const v = c[tri];
    return v == null ? "" : String(v).toLowerCase();
  };
  rows.sort((a, b) => {
    const va = val(a);
    const vb = val(b);
    if (!va && vb) return 1;
    if (va && !vb) return -1;
    return va < vb ? -dir : va > vb ? dir : 0;
  });

  return { rows, counts };
}

export function filtersFromParams(p: URLSearchParams): ContactFilters {
  return {
    q: p.get("q") ?? undefined,
    produit: p.get("produit") ?? undefined,
    segment: p.get("segment") ?? undefined,
    provenance: p.get("provenance") ?? undefined,
    type: p.get("type") ?? undefined,
    nrp: p.get("nrp") === "1",
    sansAction: p.get("sans_action") === "1",
    du: p.get("du") ?? undefined,
    au: p.get("au") ?? undefined,
    tri: p.get("tri") ?? undefined,
    sens: p.get("sens") === "desc" ? "desc" : "asc"
  };
}
