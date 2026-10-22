import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/gpf/activityLog";
import { addDays, closeAutoRelances, createTask } from "@/lib/gpf/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESULTATS = ["joint", "nrp", "messagerie", "rappeler"];
// Relances après un appel sans réponse : J+1, puis J+3, puis J+7.
const DELAIS_NRP = [1, 3, 7];
const ORIGINES_RELANCE = ["relance_nrp", "rappel_programme", "nouveau_lead"];

/**
 * « Appel effectué » : enregistre le résultat, met à jour le compteur NRP et
 * programme la relance suivante. Dès que le contact répond, la séquence de
 * relance s'arrête. Après 4 tentatives sans réponse, l'interface propose de
 * passer l'affaire en Perdu (motif « Injoignable ») — sans le faire seule.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || !RESULTATS.includes(body.resultat)) return NextResponse.json({ ok: false, error: "resultat_invalide" }, { status: 400 });
  if (body.resultat === "rappeler" && !body.rappel_at) return NextResponse.json({ ok: false, error: "date_rappel_requise" }, { status: 400 });

  const { data: client } = await supabaseAdmin.from("gpf_clients").select("id, prenom, nom, nrp_count").eq("id", params.id).single();
  if (!client) return NextResponse.json({ ok: false, error: "introuvable" }, { status: 404 });

  const { error } = await supabaseAdmin.from("gpf_calls").insert({
    client_id: params.id,
    dossier_id: body.dossier_id ?? null,
    resultat: body.resultat,
    rappel_at: body.rappel_at ?? null,
    note: body.note?.trim() || null
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const now = new Date();
  const sansReponse = body.resultat === "nrp" || body.resultat === "messagerie";
  const nrpCount = sansReponse ? (client.nrp_count ?? 0) + 1 : 0;
  await supabaseAdmin.from("gpf_clients").update({ nrp_count: nrpCount, dernier_contact_at: now.toISOString() }).eq("id", params.id);

  let relance: string | null = null;
  if (sansReponse) {
    await closeAutoRelances(params.id, ["relance_nrp", "nouveau_lead"]);
    const delai = DELAIS_NRP[Math.min(nrpCount, DELAIS_NRP.length) - 1];
    if (nrpCount <= DELAIS_NRP.length) {
      const echeance = addDays(now, delai);
      await createTask({
        client_id: params.id,
        dossier_id: body.dossier_id ?? null,
        titre: `Relancer ${client.prenom} ${client.nom} (tentative ${nrpCount + 1})`,
        categorie: "appel",
        echeance,
        auto: true,
        origine: "relance_nrp"
      });
      relance = echeance.toISOString();
    }
  } else {
    // Le contact a répondu (ou un rappel est convenu) : on arrête la séquence.
    await closeAutoRelances(params.id, ORIGINES_RELANCE);
    if (body.resultat === "rappeler") {
      await createTask({
        client_id: params.id,
        dossier_id: body.dossier_id ?? null,
        titre: `Rappeler ${client.prenom} ${client.nom}`,
        categorie: "appel",
        echeance: body.rappel_at,
        auto: true,
        origine: "rappel_programme"
      });
      relance = body.rappel_at;
    }
  }

  await logActivity("update", "client", params.id, `Appel : ${body.resultat}${body.note ? ` — ${body.note}` : ""}`);
  return NextResponse.json({ ok: true, nrpCount, relance, proposerPerdu: nrpCount >= 4 });
}
