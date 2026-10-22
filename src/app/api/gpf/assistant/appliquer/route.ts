import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { CHAMPS_CLIENT, CHAMPS_DOSSIER, sansSante } from "@/lib/gpf/assistant";
import { createTask } from "@/lib/gpf/tasks";
import { logActivity } from "@/lib/gpf/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NUMERIQUES = /^(budget\.|fiscalite\.)|^(nb_enfants|montant_pret|taux|duree_mois|cout_assurance_banque|cout_assurance_delegation|prime_mensuelle)$/;

/**
 * Applique une proposition de l'assistant, uniquement après le clic de
 * l'utilisateur, et seulement sur les champs qu'il a gardés cochés.
 */
export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const action = body?.action as { cible: string; id: string | null; client_id?: string | null; champs: Record<string, unknown> } | undefined;
  if (!action?.cible || !action.champs) return NextResponse.json({ ok: false, error: "action_invalide" }, { status: 400 });
  const valeur = (cle: string, v: unknown) => (NUMERIQUES.test(cle) && v !== null && v !== "" ? Number(String(v).replace(/\s/g, "").replace(",", ".")) : v);

  if (action.cible === "client" || action.cible === "dossier") {
    if (!action.id) return NextResponse.json({ ok: false, error: "id_requis" }, { status: 400 });
    const libelles = action.cible === "client" ? CHAMPS_CLIENT : CHAMPS_DOSSIER;
    const table = action.cible === "client" ? "gpf_clients" : "gpf_dossiers";
    const { data: avant } = await supabaseAdmin.from(table).select("*").eq("id", action.id).single();
    if (!avant) return NextResponse.json({ ok: false, error: "introuvable" }, { status: 404 });
    const patch: Record<string, unknown> = {};
    for (const [cle, v] of Object.entries(action.champs)) {
      if (!(cle in libelles)) continue;
      const [racine, sous] = cle.split(".");
      if (sous) patch[racine] = { ...((patch[racine] as object) ?? (avant[racine] as object) ?? {}), [sous]: valeur(cle, v) };
      else patch[racine] = valeur(cle, v);
    }
    if (!Object.keys(patch).length) return NextResponse.json({ ok: false, error: "aucun_champ" }, { status: 400 });
    patch.updated_at = new Date().toISOString();
    const { error } = await supabaseAdmin.from(table).update(patch).eq("id", action.id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    await logActivity("update", action.cible === "client" ? "client" : "dossier", action.id, `Via l'assistant : ${Object.keys(action.champs).map((k) => libelles[k] ?? k).join(", ")}`);
    return NextResponse.json({ ok: true });
  }

  if (action.cible === "note") {
    const contenu = sansSante(String(action.champs.contenu ?? ""));
    if (!contenu || !action.client_id) return NextResponse.json({ ok: false, error: "contenu_requis" }, { status: 400 });
    const categorie = ["reunion", "suivi", "conformite", "contrats", "autre"].includes(String(action.champs.categorie)) ? action.champs.categorie : "suivi";
    const { error } = await supabaseAdmin.from("gpf_notes").insert({ client_id: action.client_id, categorie, contenu });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action.cible === "tache") {
    const titre = String(action.champs.titre ?? "").trim();
    if (!titre) return NextResponse.json({ ok: false, error: "titre_requis" }, { status: 400 });
    const ech = action.champs.echeance ? new Date(`${String(action.champs.echeance).slice(0, 10)}T09:00:00`) : null;
    await createTask({
      client_id: action.client_id ?? null,
      titre,
      categorie: (["appel", "email", "sms", "document", "relance", "conformite", "suivi", "reunion"].includes(String(action.champs.categorie)) ? action.champs.categorie : "suivi") as "suivi",
      echeance: ech && !Number.isNaN(ech.getTime()) ? ech.toISOString() : null
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "cible_invalide" }, { status: 400 });
}
