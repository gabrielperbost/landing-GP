import { NextRequest, NextResponse } from "next/server";
import { ingererLead } from "@/lib/gpf/leads";
import { champsFormulaire, MOTIFS, secretValide, trouver } from "@/lib/gpf/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Tally (Paramètres du formulaire → Integrations → Webhooks), adresse
 * affichée dans la page Leads du CRM. Chaque réponse devient un lead.
 */
export async function POST(request: NextRequest) {
  if (!secretValide(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const data = body?.data;
  if (!data) return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  const champs = champsFormulaire(data.fields ?? []);
  const complet = trouver(champs, MOTIFS.complet);
  const r = await ingererLead({
    source: "Tally",
    sourceRef: data.responseId ?? data.submissionId ?? body.eventId ?? null,
    prenom: trouver(champs, MOTIFS.prenom) ?? complet,
    nom: trouver(champs, MOTIFS.nom),
    email: trouver(champs, MOTIFS.email),
    telephone: trouver(champs, MOTIFS.telephone),
    code_postal: trouver(champs, MOTIFS.codePostal),
    ville: trouver(champs, MOTIFS.ville),
    produit: trouver(champs, MOTIFS.produit) ?? data.formName ?? null,
    message: trouver(champs, MOTIFS.message)
  });
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
