import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const page = (titre: string, texte: string) =>
  new NextResponse(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titre}</title></head><body style="font-family:Georgia,serif;background:#F7F6F2;color:#071C2C;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px"><div style="max-width:440px;text-align:center"><p style="letter-spacing:.2em;font-size:12px;color:#CDAA5A">GP FINANCES</p><h1 style="font-weight:normal">${titre}</h1><p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">${texte}</p></div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );

// Lien de désabonnement présent dans chaque e-mail de séquence ou de campagne.
export async function GET(request: NextRequest) {
  const t = request.nextUrl.searchParams.get("t") ?? "";
  if (!/^[0-9a-f-]{36}$/.test(t)) return page("Lien invalide", "Ce lien de désabonnement n'est pas valide.");
  const { data } = await supabaseAdmin.from("gpf_clients").update({ desabonne_at: new Date().toISOString() }).eq("desabo_token", t).is("desabonne_at", null).select("id");
  return page("Désabonnement confirmé", data?.length !== 0 ? "Vous ne recevrez plus nos e-mails d'information. Votre conseiller reste joignable si besoin." : "Vous étiez déjà désabonné(e).");
}
