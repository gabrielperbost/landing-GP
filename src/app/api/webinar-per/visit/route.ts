import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Compteur de visites de la page d'inscription du webinaire du 8 novembre, pour savoir combien de
 * personnes arrivées par Meta ne se sont pas inscrites. Écrit dans l'onglet « Visites Meta » du Google
 * Sheet du 8 novembre via un Apps Script SÉPARÉ de celui des inscriptions (variables
 * WEBINAR_PER_8NOV_VISITS_APPS_SCRIPT_URL / _SECRET) : les inscriptions ne dépendent jamais de ce compteur.
 * Aucune donnée personnelle : source, support, campagne, publicité et un identifiant de clic haché.
 * Ne renvoie jamais d'erreur à la page (204 dans tous les cas).
 */
const env = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "").trim() || undefined;
const champ = (v: unknown, max = 80) => String(v ?? "").replace(/[^\w\-.:/ ]/g, "").slice(0, max);
const vide = () => new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const url = env(process.env.WEBINAR_PER_8NOV_VISITS_APPS_SCRIPT_URL);
  const secret = env(process.env.WEBINAR_PER_8NOV_VISITS_APPS_SCRIPT_SECRET);
  if (!url || !secret) return vide();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return vide();
  }
  if (body.session !== "2026-11-08") return vide();
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        action: "visit",
        visit: {
          source: champ(body.source, 40),
          medium: champ(body.medium, 40),
          campaign: champ(body.campaign),
          content: champ(body.content),
          clic: champ(body.clic, 24)
        }
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
  } catch (error) {
    console.warn("[webinar-per-visit] compteur indisponible", error instanceof Error ? error.message : error);
  }
  return vide();
}
