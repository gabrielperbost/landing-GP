import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ingererLead } from "@/lib/gpf/leads";
import { notify } from "@/lib/gpf/notify";
import { champsFormulaire, egalConstant, MOTIFS, trouver } from "@/lib/gpf/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Meta Lead Ads (gratuit, via une app Meta for Developers abonnée au
 * champ « leadgen » de la page). GET : vérification de l'abonnement ; POST :
 * chaque lead est relu via l'API Graph (META_PAGE_ACCESS_TOKEN) puis créé.
 */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const attendu = process.env.GPF_WEBHOOK_SECRET?.trim();
  if (p.get("hub.mode") === "subscribe" && attendu && egalConstant(p.get("hub.verify_token") ?? "", attendu)) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return NextResponse.json({ ok: false }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const brut = await request.text();
  // Signature Meta (X-Hub-Signature-256) vérifiée quand le secret de l'app est configuré.
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (appSecret) {
    const sig = request.headers.get("x-hub-signature-256") ?? "";
    const attendu = "sha256=" + crypto.createHmac("sha256", appSecret).update(brut).digest("hex");
    if (!egalConstant(sig, attendu)) return NextResponse.json({ ok: false, error: "signature" }, { status: 401 });
  } else return NextResponse.json({ ok: false, error: "meta_non_configure" }, { status: 503 });

  const body = JSON.parse(brut || "{}");
  const token = process.env.META_PAGE_ACCESS_TOKEN?.trim();
  let traites = 0;
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") continue;
      const leadId = change.value?.leadgen_id;
      if (!leadId) continue;
      if (!token) {
        await notify("nouveau_lead", "Lead Meta reçu (détails non lisibles)", "Ajoutez META_PAGE_ACCESS_TOKEN pour récupérer automatiquement les coordonnées.", "/gpf/leads");
        continue;
      }
      const res = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(leadId)}?fields=field_data,ad_name,campaign_name,form_id&access_token=${encodeURIComponent(token)}`);
      const lead = await res.json().catch(() => null);
      if (!res.ok || !lead) continue;
      const champs = champsFormulaire((lead.field_data ?? []).map((f: { name: string; values: string[] }) => ({ name: f.name, value: f.values?.join(", ") })));
      await ingererLead({
        source: "Meta Ads",
        sourceRef: String(leadId),
        prenom: trouver(champs, MOTIFS.prenom) ?? trouver(champs, MOTIFS.complet),
        nom: trouver(champs, MOTIFS.nom),
        email: trouver(champs, MOTIFS.email),
        telephone: trouver(champs, MOTIFS.telephone),
        code_postal: trouver(champs, MOTIFS.codePostal),
        ville: trouver(champs, MOTIFS.ville),
        produit: trouver(champs, MOTIFS.produit) ?? lead.campaign_name ?? lead.ad_name ?? null
      });
      traites++;
    }
  }
  return NextResponse.json({ ok: true, traites });
}
