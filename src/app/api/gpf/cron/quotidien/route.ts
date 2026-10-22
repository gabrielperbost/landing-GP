import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { GPF_PRODUIT_LABEL, GPF_STATUTS_SIGNES, type GpfProduit } from "@/lib/gpf/types";
import { prochaineEcheance } from "@/lib/gpf/contrats";
import { notify } from "@/lib/gpf/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization")?.replace("Bearer ", "") === secret;
}

/**
 * Passage quotidien (Vercel Cron) : notifications « échéance proche » (mutuelle
 * et prévoyance résiliables dans les 60 jours) et « lead non rappelé depuis
 * plus de 24 h ». Une même alerte n'est jamais créée deux fois.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);
  const dans60 = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
  const [{ data: dossiers }, { data: clients }, { data: existantes }, { data: appels }] = await Promise.all([
    supabaseAdmin.from("gpf_dossiers").select("*").is("deleted_at", null),
    supabaseAdmin.from("gpf_clients").select("*").is("deleted_at", null),
    supabaseAdmin.from("gpf_notifications").select("type, lien, created_at").gte("created_at", new Date(Date.now() - 75 * 86400000).toISOString()),
    supabaseAdmin.from("gpf_calls").select("client_id")
  ]);
  const deja = new Set((existantes ?? []).map((n) => `${n.type}|${n.lien}`));
  const clientById = new Map((clients ?? []).map((c) => [c.id, c]));
  let echeances = 0;
  let leads = 0;

  for (const d of dossiers ?? []) {
    const actif = d.contrat_statut ? d.contrat_statut === "actif" : GPF_STATUTS_SIGNES.has(d.statut);
    if (!actif || (d.produit !== "mutuelle" && d.produit !== "prevoyance")) continue;
    const e = prochaineEcheance(d);
    if (!e || e < today || e > dans60) continue;
    const lien = `/gpf/contacts/${d.client_id}?dossier=${d.id}`;
    if (deja.has(`echeance|${lien}`)) continue;
    const c = clientById.get(d.client_id);
    await notify(
      "echeance",
      `Échéance proche : ${c ? `${c.prenom} ${String(c.nom).toUpperCase()}` : "contrat"}`,
      `${GPF_PRODUIT_LABEL[d.produit as GpfProduit]}${d.assureur_nom ? ` — ${d.assureur_nom}` : ""}, échéance le ${new Date(e + "T00:00:00").toLocaleDateString("fr-FR")}`,
      lien
    );
    echeances++;
  }

  const signes = new Set((dossiers ?? []).filter((d) => GPF_STATUTS_SIGNES.has(d.statut) || d.contrat_statut).map((d) => d.client_id));
  const appeles = new Set((appels ?? []).map((a) => a.client_id));
  const il7j = new Date(Date.now() - 7 * 86400000).toISOString();
  for (const c of clients ?? []) {
    if (signes.has(c.id) || c.dernier_contact_at || appeles.has(c.id)) continue;
    if (c.created_at < il7j || Date.now() - new Date(c.created_at).getTime() < 24 * 3600_000) continue;
    const lien = `/gpf/contacts/${c.id}`;
    if (deja.has(`relance|${lien}`)) continue;
    await notify("relance", `Lead non rappelé depuis plus de 24 h : ${c.prenom} ${String(c.nom).toUpperCase()}`, c.provenance ?? undefined, lien);
    leads++;
  }

  return NextResponse.json({ ok: true, echeances, leads });
}
