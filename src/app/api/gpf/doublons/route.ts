import { NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const strip = (s: string | null | undefined) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .trim();

const emailKey = (e: string | null) => (e?.trim() ? e.trim().toLowerCase() : null);
const phoneKey = (t: string | null) => {
  const digits = (t ?? "").replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : null;
};
// Même nom quel que soit l'ordre (« Lopes Carlos » = « Carlos Lopes »).
const nameKey = (prenom: string, nom: string) => {
  const tokens = `${strip(prenom)} ${strip(nom)}`.split(/[\s-]+/).filter(Boolean).sort();
  return tokens.length >= 2 ? tokens.join(" ") : null;
};

// Détection seulement : aucune fusion n'est faite ici. Les fusions passent
// par /api/gpf/doublons/fusionner après validation explicite.
export async function GET() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const [{ data: clients, error }, { data: dossiers }] = await Promise.all([
    supabaseAdmin.from("gpf_clients").select("id, prenom, nom, email, telephone, ville, created_at").is("deleted_at", null),
    supabaseAdmin
      .from("gpf_dossiers")
      .select(
        "id, client_id, co_client_id, produit, statut, assureur_nom, date_effet, prime_mensuelle, montant_pret, precompte_lineaire_1ere_annee, lineaire_n1, created_at"
      )
      .is("deleted_at", null)
  ]);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // --- Fiches client en double : union des fiches qui partagent un email,
  // un téléphone ou le même nom (dans n'importe quel ordre).
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    const p = parent.get(x) ?? x;
    if (p === x) return x;
    const root = find(p);
    parent.set(x, root);
    return root;
  };
  const union = (a: string, b: string) => parent.set(find(a), find(b));
  const reasonsByPair = new Map<string, Set<string>>();

  const byKey = new Map<string, string[]>();
  for (const c of clients ?? []) {
    const keys = [
      ["email", emailKey(c.email)],
      ["téléphone", phoneKey(c.telephone)],
      ["nom", nameKey(c.prenom, c.nom)]
    ] as const;
    for (const [label, k] of keys) {
      if (!k) continue;
      const full = `${label}|${k}`;
      if (!byKey.has(full)) byKey.set(full, []);
      byKey.get(full)!.push(c.id);
    }
  }
  for (const [full, ids] of byKey) {
    if (ids.length < 2) continue;
    const label = full.split("|")[0];
    for (let i = 1; i < ids.length; i++) union(ids[0], ids[i]);
    for (const id of ids) {
      if (!reasonsByPair.has(id)) reasonsByPair.set(id, new Set());
      reasonsByPair.get(id)!.add(`même ${label}`);
    }
  }

  const dossierCount = new Map<string, number>();
  for (const d of dossiers ?? []) {
    for (const cid of [d.client_id, d.co_client_id].filter(Boolean) as string[]) dossierCount.set(cid, (dossierCount.get(cid) ?? 0) + 1);
  }

  const groupsMap = new Map<string, typeof clients>();
  for (const c of clients ?? []) {
    if (!reasonsByPair.has(c.id)) continue;
    const root = find(c.id);
    if (!groupsMap.has(root)) groupsMap.set(root, []);
    groupsMap.get(root)!.push(c);
  }
  const clientGroups = [...groupsMap.values()]
    .filter((g) => (g?.length ?? 0) > 1)
    .map((g) => {
      const members = g!.map((c) => ({ ...c, nbDossiers: dossierCount.get(c.id) ?? 0 }));
      const raisons = new Set<string>();
      for (const m of members) for (const r of reasonsByPair.get(m.id) ?? []) raisons.add(r);
      return { key: members.map((m) => m.id).sort().join(","), raisons: [...raisons], members };
    });

  // --- Dossiers en double : même client, même produit, même assureur (ou
  // assureur vide des deux côtés) et même date d'effet.
  const clientById = new Map((clients ?? []).map((c) => [c.id, c]));
  const dossierGroupsMap = new Map<string, NonNullable<typeof dossiers>>();
  for (const d of dossiers ?? []) {
    const k = [d.client_id, d.produit, strip(d.assureur_nom), d.date_effet ?? ""].join("|");
    if (!dossierGroupsMap.has(k)) dossierGroupsMap.set(k, []);
    dossierGroupsMap.get(k)!.push(d);
  }
  const dossierGroups = [...dossierGroupsMap.values()]
    .filter((g) => g.length > 1)
    .map((g) => {
      const c = clientById.get(g[0].client_id);
      return { key: g.map((d) => d.id).sort().join(","), client: c ? { id: c.id, prenom: c.prenom, nom: c.nom } : null, members: g };
    });

  // Fusions récentes, pour pouvoir les annuler (table créée par la migration 004).
  const { data: merges, error: mergesError } = await supabaseAdmin
    .from("gpf_merges")
    .select("id, entity_type, kept_id, merged_id, snapshot, created_at")
    .eq("undone", false)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    ok: true,
    clientGroups,
    dossierGroups,
    merges: (merges ?? []).map((m) => ({
      id: m.id,
      entity_type: m.entity_type,
      created_at: m.created_at,
      label:
        m.entity_type === "client"
          ? `${m.snapshot?.merged?.prenom ?? ""} ${m.snapshot?.merged?.nom ?? ""}`.trim()
          : `${m.snapshot?.merged?.produit ?? "dossier"}`
    })),
    mergesDisponibles: !mergesError
  });
}
