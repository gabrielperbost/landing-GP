import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { COOKIE, consommerLien, valeurCookie } from "@/lib/gpf/portail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lien magique : ouvre la session de l'espace client puis redirige vers le tableau.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t") ?? "";
  const clientId = await consommerLien(token).catch(() => null);
  const base = request.nextUrl.clone();
  base.search = "";
  if (!clientId) {
    base.pathname = "/mon-espace";
    base.searchParams.set("erreur", "lien");
    return NextResponse.redirect(base);
  }
  await supabaseAdmin.from("gpf_clients").update({ portail_derniere_connexion: new Date().toISOString() }).eq("id", clientId);
  base.pathname = "/mon-espace/tableau";
  const res = NextResponse.redirect(base);
  const { valeur, maxAge } = valeurCookie(clientId);
  res.cookies.set(COOKIE, valeur, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge });
  return res;
}
