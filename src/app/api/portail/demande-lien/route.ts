import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { envoyerLienPortail, limiter } from "@/lib/gpf/portail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Demande d'un lien d'accès depuis la page de connexion. La réponse est la
 * même que l'adresse soit connue ou non (pas de divulgation des clients).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnue";
  if (!limiter(`ip:${ip}`, 10) || !limiter(`email:${email}`, 3)) return NextResponse.json({ ok: false, error: "trop_de_demandes" }, { status: 429 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ ok: false, error: "email_invalide" }, { status: 400 });

  const { data } = await supabaseAdmin.from("gpf_clients").select("id").ilike("email", email.replace(/[%_]/g, "")).is("deleted_at", null).limit(1);
  if (data?.[0]) await envoyerLienPortail(data[0].id).catch((e) => console.error("portail-lien", e));
  return NextResponse.json({ ok: true });
}
