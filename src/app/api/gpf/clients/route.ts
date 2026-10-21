import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/gpf/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const produitFilter = request.nextUrl.searchParams.get("produit")?.trim();
  const segment = request.nextUrl.searchParams.get("segment")?.trim(); // "client" | "prospect"

  let query = supabaseAdmin.from("gpf_clients").select("*").is("deleted_at", null).order("nom", { ascending: true });
  if (q) query = query.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Produits de chaque client, pour les afficher directement dans la liste (vue "par catégorie")
  // sans devoir ouvrir chaque fiche. Un client peut apparaître comme emprunteur principal OU
  // co-emprunteur sur un dossier.
  const clientIds = (data ?? []).map((c) => c.id);
  let produitsByClient = new Map<string, string[]>();
  let statutsByClient = new Map<string, string[]>();
  if (clientIds.length) {
    const { data: dossiers } = await supabaseAdmin
      .from("gpf_dossiers")
      .select("client_id, co_client_id, produit, statut")
      .or(`client_id.in.(${clientIds.join(",")}),co_client_id.in.(${clientIds.join(",")})`)
      .is("deleted_at", null);
    for (const d of dossiers ?? []) {
      for (const cid of [d.client_id, d.co_client_id].filter(Boolean) as string[]) {
        if (!produitsByClient.has(cid)) produitsByClient.set(cid, []);
        if (!produitsByClient.get(cid)!.includes(d.produit)) produitsByClient.get(cid)!.push(d.produit);
        if (!statutsByClient.has(cid)) statutsByClient.set(cid, []);
        if (!statutsByClient.get(cid)!.includes(d.statut)) statutsByClient.get(cid)!.push(d.statut);
      }
    }
  }

  let clients = (data ?? []).map((c) => {
    const statuts = statutsByClient.get(c.id) ?? [];
    return {
      ...c,
      produits: produitsByClient.get(c.id) ?? [],
      statuts,
      est_client: statuts.includes("effectif")
    };
  });

  if (produitFilter) clients = clients.filter((c) => c.produits.includes(produitFilter));
  if (segment === "client") clients = clients.filter((c) => c.est_client);
  if (segment === "prospect") clients = clients.filter((c) => !c.est_client);

  return NextResponse.json({ ok: true, clients });
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
