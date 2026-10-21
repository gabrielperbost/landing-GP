import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { GPF_PRODUIT_LABEL, formatNom, type GpfProduit } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Recherche globale (palette ⌘K) : contacts, puis contrats et affaires.
export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const q = request.nextUrl.searchParams.get("q")?.trim().replace(/[,()%]/g, " ") ?? "";
  if (q.length < 2) return NextResponse.json({ ok: true, resultats: [] });

  const { data: contacts } = await supabaseAdmin
    .from("gpf_clients")
    .select("id, prenom, nom, email, telephone")
    .is("deleted_at", null)
    .or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,email.ilike.%${q}%,telephone.ilike.%${q}%`)
    .limit(8);

  const contactIds = (contacts ?? []).map((c) => c.id);
  const orParts = [`reference_contrat.ilike.%${q}%`, `assureur_nom.ilike.%${q}%`];
  if (contactIds.length) orParts.push(`client_id.in.(${contactIds.join(",")})`);
  const { data: dossiers } = await supabaseAdmin
    .from("gpf_dossiers")
    .select("id, client_id, produit, statut, contrat_statut, assureur_nom, reference_contrat")
    .is("deleted_at", null)
    .or(orParts.join(","))
    .limit(10);

  const extraIds = Array.from(new Set((dossiers ?? []).map((d) => d.client_id).filter((id) => !contactIds.includes(id))));
  const { data: extra } = extraIds.length ? await supabaseAdmin.from("gpf_clients").select("id, prenom, nom").in("id", extraIds) : { data: [] };
  const byId = new Map([...(contacts ?? []), ...(extra ?? [])].map((c) => [c.id, c]));

  const resultats = [
    ...(contacts ?? []).map((c) => ({
      type: "contact" as const,
      id: c.id,
      label: formatNom(c),
      detail: c.email ?? c.telephone ?? "",
      href: `/gpf/contacts/${c.id}`
    })),
    ...(dossiers ?? []).map((d) => ({
      type: d.contrat_statut ? ("contrat" as const) : ("affaire" as const),
      id: d.id,
      label: `${GPF_PRODUIT_LABEL[d.produit as GpfProduit]} — ${formatNom(byId.get(d.client_id))}`,
      detail: [d.assureur_nom, d.reference_contrat ? `n° ${d.reference_contrat}` : null].filter(Boolean).join(" · "),
      href: `/gpf/contacts/${d.client_id}?dossier=${d.id}`
    }))
  ];

  return NextResponse.json({ ok: true, resultats });
}
