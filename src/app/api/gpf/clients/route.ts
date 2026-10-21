import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/gpf/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liste paginée côté serveur (50 par défaut) avec les compteurs Tous / Clients
// / Prospects calculés ici, pour que le navigateur ne reçoive jamais plus
// d'une page et que les onglets affichent leurs vrais chiffres dès le départ.
export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim();
  const produitFilter = params.get("produit")?.trim();
  const segment = params.get("segment")?.trim(); // "client" | "prospect"
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const pageSize = Math.min(2000, Math.max(1, Number(params.get("pageSize") ?? "50") || 50));

  let query = supabaseAdmin.from("gpf_clients").select("*").is("deleted_at", null).order("nom", { ascending: true });
  if (q) query = query.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,email.ilike.%${q}%,telephone.ilike.%${q}%`);

  const [{ data, error }, { data: dossiers }] = await Promise.all([
    query,
    supabaseAdmin.from("gpf_dossiers").select("client_id, co_client_id, produit, statut").is("deleted_at", null)
  ]);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Un client peut apparaître comme emprunteur principal OU co-emprunteur.
  const produitsByClient = new Map<string, Set<string>>();
  const statutsByClient = new Map<string, Set<string>>();
  for (const d of dossiers ?? []) {
    for (const cid of [d.client_id, d.co_client_id].filter(Boolean) as string[]) {
      if (!produitsByClient.has(cid)) produitsByClient.set(cid, new Set());
      produitsByClient.get(cid)!.add(d.produit);
      if (!statutsByClient.has(cid)) statutsByClient.set(cid, new Set());
      statutsByClient.get(cid)!.add(d.statut);
    }
  }

  let clients = (data ?? []).map((c) => {
    const statuts = [...(statutsByClient.get(c.id) ?? [])];
    return { ...c, produits: [...(produitsByClient.get(c.id) ?? [])], statuts, est_client: statuts.includes("effectif") };
  });

  if (produitFilter) clients = clients.filter((c) => c.produits.includes(produitFilter));

  const nbClients = clients.filter((c) => c.est_client).length;
  const counts = { tous: clients.length, client: nbClients, prospect: clients.length - nbClients };

  if (segment === "client") clients = clients.filter((c) => c.est_client);
  if (segment === "prospect") clients = clients.filter((c) => !c.est_client);

  const total = clients.length;
  const pageItems = clients.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({ ok: true, clients: pageItems, total, page, pageSize, counts });
}

export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.prenom?.trim() || !body?.nom?.trim()) {
    return NextResponse.json({ ok: false, error: "prenom_nom_requis" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("gpf_clients")
    .insert({
      civilite: body.civilite || null,
      prenom: body.prenom.trim(),
      nom: body.nom.trim(),
      email: body.email || null,
      telephone: body.telephone || null,
      adresse: body.adresse || null,
      ville: body.ville || null,
      code_postal: body.code_postal || null,
      annee_naissance: body.annee_naissance || null,
      profession: body.profession || null,
      fumeur: typeof body.fumeur === "boolean" ? body.fumeur : null,
      notes: body.notes || null
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await logActivity("create", "client", data.id, `${data.prenom} ${data.nom}`.trim());
  return NextResponse.json({ ok: true, client: data });
}
